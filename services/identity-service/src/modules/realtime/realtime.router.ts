'use strict';

import { Router } from 'express';
import type { Response } from 'express';
import { randomUUID } from 'crypto';
import { requireAuth } from '../../middlewares';
import { getServiceClients } from '../../config/service-clients';
import { WaitlistModel } from '../waitlists/waitlist.model';
import type { AuthenticatedRequest } from '../../utils';
import { requireTenantId } from '../../utils';

const setupSse = (res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  (res as Response & { flushHeaders?: () => void }).flushHeaders?.();

  return (data: unknown) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
};

type SerializableAppointment = Record<string, any> & { _id: string };

const serializeAppointment = (appointment: Record<string, any>): SerializableAppointment =>
  JSON.parse(JSON.stringify(appointment)) as SerializableAppointment;

const createAppointmentFingerprint = (appointment: SerializableAppointment) =>
  JSON.stringify({
    status: appointment.status,
    scheduledAt: appointment.scheduledAt,
    updatedAt: appointment.updatedAt,
    consultation: appointment.consultation,
    paymentStatus: appointment.payment?.status ?? null,
    followUpActions: appointment.consultation?.followUpActions ?? null,
    notes: appointment.consultation?.notes ?? null,
  });

const registerAppointmentStream = ({
  res,
  fetchAppointments,
  onClose,
}: {
  res: Response;
  fetchAppointments: () => Promise<SerializableAppointment[]>;
  onClose: () => void;
}) => {
  const sendEvent = setupSse(res);
  const connectionId = randomUUID();
  const heartbeat = () => {
    sendEvent({
      type: 'heartbeat',
      connectionId,
    });
  };

  const fingerprints = new Map<string, string>();
  const statusSnapshot = new Map<string, string>();
  let isClosed = false;
  let isRefreshing = false;

  const refreshAppointments = async () => {
    if (isClosed || isRefreshing) {
      return;
    }
    isRefreshing = true;
    try {
      const appointments = await fetchAppointments();
      const nextMap = new Map<string, SerializableAppointment>();
      for (const appointment of appointments) {
        const id = appointment._id;
        nextMap.set(id, appointment);
        const nextFingerprint = createAppointmentFingerprint(appointment);
        const previousFingerprint = fingerprints.get(id);
        const previousStatus = statusSnapshot.get(id);

        if (!previousFingerprint) {
          fingerprints.set(id, nextFingerprint);
          statusSnapshot.set(id, appointment.status ?? null);
          sendEvent({
            type: 'appointment.created',
            appointment,
          });
          continue;
        }

        if (previousFingerprint !== nextFingerprint) {
          fingerprints.set(id, nextFingerprint);
          statusSnapshot.set(id, appointment.status ?? null);
          const eventType =
            previousStatus && previousStatus !== appointment.status
              ? 'appointment.status.changed'
              : 'appointment.updated';
          sendEvent({
            type: eventType,
            appointment,
          });
        }
      }

      for (const [storedId] of fingerprints) {
        if (!nextMap.has(storedId)) {
          fingerprints.delete(storedId);
          statusSnapshot.delete(storedId);
          sendEvent({
            type: 'appointment.removed',
            appointmentId: storedId,
          });
        }
      }
    } catch (error) {
      console.error('[realtime] Failed to refresh appointment stream', error);
      sendEvent({
        type: 'error',
        message: 'Unable to refresh appointment feed',
      });
    } finally {
      isRefreshing = false;
    }
  };

  const refreshInterval = setInterval(() => {
    void refreshAppointments();
  }, 10_000);

  const heartbeatInterval = setInterval(() => {
    heartbeat();
  }, 25_000);

  void refreshAppointments();
  heartbeat();

  return () => {
    isClosed = true;
    clearInterval(refreshInterval);
    clearInterval(heartbeatInterval);
    onClose();
  };
};

export const realtimeRouter: Router = Router();

realtimeRouter.get('/dashboard', requireAuth(['admin']), async (req, res, next) => {
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const connectionId = randomUUID();
    const tenantId = requireTenantId(req);

    const sendEvent = (data: unknown) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const publishMetrics = async () => {
      const { analytics } = getServiceClients(req);
      const metrics = await analytics.getOpsPulse(tenantId);
      sendEvent({
        type: 'metrics.updated',
        metrics,
      });
    };

    const heartbeat = () => {
      sendEvent({
        type: 'heartbeat',
        connectionId,
      });
    };

    await publishMetrics();
    heartbeat();

    const metricsInterval = setInterval(() => {
      publishMetrics().catch((error) => {
        console.error('[realtime] Failed to refresh ops metrics', error);
      });
    }, 15_000);

    const heartbeatInterval = setInterval(() => {
      heartbeat();
    }, 30_000);

    req.on('close', () => {
      clearInterval(metricsInterval);
      clearInterval(heartbeatInterval);
      res.end();
    });
  } catch (error) {
    next(error);
  }
});

realtimeRouter.get(
  '/consultations',
  requireAuth(['doctor']),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const doctorId = req.user?.id;

      if (!doctorId) {
        throw new Error('Doctor context missing');
      }

      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new Error('Tenant context missing');
      }

      const { appointment } = getServiceClients(req);
      const cleanup = registerAppointmentStream({
        res,
        fetchAppointments: async () => {
          const result = await appointment.listAppointments({
            doctorId,
            limit: 100,
          });
          return result.appointments.map((apt: SerializableAppointment) =>
            serializeAppointment(apt),
          );
        },
        onClose: () => {
          res.end();
        },
      });

      req.on('close', () => {
        cleanup();
      });
    } catch (error) {
      next(error);
    }
  },
);

realtimeRouter.get(
  '/appointments',
  requireAuth(['patient']),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const patientId = req.user?.id;

      if (!patientId) {
        throw new Error('Patient context missing');
      }

      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new Error('Tenant context missing');
      }

      const { appointment } = getServiceClients(req);
      const cleanup = registerAppointmentStream({
        res,
        fetchAppointments: async () => {
          const result = await appointment.listAppointments({
            patientId,
            limit: 100,
          });
          return result.appointments.map((apt: SerializableAppointment) =>
            serializeAppointment(apt),
          );
        },
        onClose: () => {
          res.end();
        },
      });

      req.on('close', () => {
        cleanup();
      });
    } catch (error) {
      next(error);
    }
  },
);

realtimeRouter.get(
  '/waitlists',
  requireAuth(['doctor']),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const doctorId = req.user?.id;

      if (!doctorId) {
        throw new Error('Doctor context missing');
      }

      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new Error('Tenant context missing');
      }

      const sendEvent = setupSse(res);
      const connectionId = randomUUID();
      const heartbeat = () => {
        sendEvent({
          type: 'heartbeat',
          connectionId,
        });
      };

      const fingerprints = new Map<string, string>();
      const statusSnapshot = new Map<string, string>();
      let isClosed = false;
      let isRefreshing = false;

      const refreshWaitlists = async () => {
        if (isClosed || isRefreshing) {
          return;
        }
        isRefreshing = true;
        try {
          const waitlists = await WaitlistModel.find({
            tenantId,
            doctorId,
          })
            .populate('patient', 'name email phone')
            .populate('doctor', 'name specialization')
            .populate('clinic', 'name slug')
            .sort({ priorityScore: -1, createdAt: 1 })
            .limit(100)
            .lean({ getters: true });

          const nextMap = new Map<string, any>();
          for (const waitlist of waitlists) {
            const id = String(waitlist._id);
            nextMap.set(id, waitlist);
            const nextFingerprint = JSON.stringify({
              status: waitlist.status,
              priorityScore: waitlist.priorityScore,
              updatedAt: waitlist.updatedAt,
              expiresAt: waitlist.expiresAt,
            });
            const previousFingerprint = fingerprints.get(id);
            const previousStatus = statusSnapshot.get(id);

            if (!previousFingerprint) {
              fingerprints.set(id, nextFingerprint);
              statusSnapshot.set(id, waitlist.status ?? null);
              sendEvent({
                type: 'waitlist.created',
                waitlist,
              });
              continue;
            }

            if (previousFingerprint !== nextFingerprint) {
              fingerprints.set(id, nextFingerprint);
              statusSnapshot.set(id, waitlist.status ?? null);
              const eventType =
                previousStatus && previousStatus !== waitlist.status
                  ? 'waitlist.status.changed'
                  : 'waitlist.updated';
              sendEvent({
                type: eventType,
                waitlist,
              });
            }
          }

          for (const [storedId] of fingerprints) {
            if (!nextMap.has(storedId)) {
              fingerprints.delete(storedId);
              statusSnapshot.delete(storedId);
              sendEvent({
                type: 'waitlist.removed',
                waitlistId: storedId,
              });
            }
          }
        } catch (error) {
          console.error('[realtime] Failed to refresh waitlist stream', error);
          sendEvent({
            type: 'error',
            message: 'Unable to refresh waitlist feed',
          });
        } finally {
          isRefreshing = false;
        }
      };

      const refreshInterval = setInterval(() => {
        void refreshWaitlists();
      }, 10_000);

      const heartbeatInterval = setInterval(() => {
        heartbeat();
      }, 25_000);

      void refreshWaitlists();
      heartbeat();

      req.on('close', () => {
        isClosed = true;
        clearInterval(refreshInterval);
        clearInterval(heartbeatInterval);
        res.end();
      });
    } catch (error) {
      next(error);
    }
  },
);
