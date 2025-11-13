"use strict";

import { Router } from "express";
import type { Response } from "express";
import { randomUUID } from "crypto";
import { requireAuth } from "../../middlewares/auth";
import { getOpsMetricsSummary } from "../analytics/analytics.service";
import { AppointmentModel } from "../appointments/appointment.model";
import type { AuthenticatedRequest } from "../../middlewares/auth";

const setupSse = (res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
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
      type: "heartbeat",
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
            type: "appointment.created",
            appointment,
          });
          continue;
        }

        if (previousFingerprint !== nextFingerprint) {
          fingerprints.set(id, nextFingerprint);
          statusSnapshot.set(id, appointment.status ?? null);
          const eventType =
            previousStatus && previousStatus !== appointment.status
              ? "appointment.status.changed"
              : "appointment.updated";
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
            type: "appointment.removed",
            appointmentId: storedId,
          });
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[realtime] Failed to refresh appointment stream", error);
      sendEvent({
        type: "error",
        message: "Unable to refresh appointment feed",
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

realtimeRouter.get("/dashboard", requireAuth(["admin"]), async (req, res, next) => {
  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    const connectionId = randomUUID();

    const sendEvent = (data: unknown) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const publishMetrics = async () => {
      const metrics = await getOpsMetricsSummary();
      sendEvent({
        type: "metrics.updated",
        metrics,
      });
    };

    const heartbeat = () => {
      sendEvent({
        type: "heartbeat",
        connectionId,
      });
    };

    await publishMetrics();
    heartbeat();

    const metricsInterval = setInterval(() => {
      publishMetrics().catch((error) => {
        // eslint-disable-next-line no-console
        console.error("[realtime] Failed to refresh ops metrics", error);
      });
    }, 15_000);

    const heartbeatInterval = setInterval(() => {
      heartbeat();
    }, 30_000);

    req.on("close", () => {
      clearInterval(metricsInterval);
      clearInterval(heartbeatInterval);
      res.end();
    });
  } catch (error) {
    next(error);
  }
});

realtimeRouter.get("/consultations", requireAuth(["doctor"]), async (req: AuthenticatedRequest, res, next) => {
  try {
    const doctorId = req.user?.id;

    if (!doctorId) {
      throw new Error("Doctor context missing");
    }

    const cleanup = registerAppointmentStream({
      res,
      fetchAppointments: async () => {
        const results = await AppointmentModel.find({ doctor: doctorId })
          .populate("patient", "name email phone")
          .populate("doctor", "name specialization consultationModes fee clinicLocations")
          .sort({ scheduledAt: 1 })
          .limit(100)
          .lean({ getters: true });

        return results.map((appointment) => serializeAppointment(appointment));
      },
      onClose: () => {
        res.end();
      },
    });

    req.on("close", () => {
      cleanup();
    });
  } catch (error) {
    next(error);
  }
});

realtimeRouter.get("/appointments", requireAuth(["patient"]), async (req: AuthenticatedRequest, res, next) => {
  try {
    const patientId = req.user?.id;

    if (!patientId) {
      throw new Error("Patient context missing");
    }

    const cleanup = registerAppointmentStream({
      res,
      fetchAppointments: async () => {
        const results = await AppointmentModel.find({ patient: patientId })
          .populate("patient", "name email phone")
          .populate("doctor", "name specialization consultationModes fee clinicLocations")
          .sort({ scheduledAt: 1 })
          .limit(100)
          .lean({ getters: true });

        return results.map((appointment) => serializeAppointment(appointment));
      },
      onClose: () => {
        res.end();
      },
    });

    req.on("close", () => {
      cleanup();
    });
  } catch (error) {
    next(error);
  }
});


