'use strict';

import type { Logger } from 'pino';
import type { WaitlistEvent } from '@illajwala/types';
import { createEventSubscriber } from '@illajwala/event-bus';
import { sendMail } from '../notifications/mailer';
import {
  sendWaitlistEmail,
  sendWaitlistSms,
  sendWaitlistWhatsapp,
} from '../notifications/waitlist.sender';

type RegisterWaitlistWorkerOptions = {
  logger: Logger;
};

type OpsMessage = {
  subject: string;
  text: string;
  html: string;
};

const clinicLabel = (event: WaitlistEvent) =>
  event.clinicName ?? (event.clinicId ? `clinic ${event.clinicId}` : 'the clinic');

const patientLabel = (event: WaitlistEvent) => event.patientName ?? event.patientId;

const buildOpsMessage = (event: WaitlistEvent): OpsMessage | null => {
  const clinic = clinicLabel(event);
  const patient = patientLabel(event);

  switch (event.type) {
    case 'waitlist.joined': {
      const text = `Patient ${patient} joined the waitlist for ${clinic}. Entry ${event.entryId}. Priority score ${event.priorityScore}.`;
      const html = `<p>Patient <strong>${patient}</strong> joined the waitlist for <strong>${clinic}</strong>.</p><p>Entry: <strong>${event.entryId}</strong><br/>Priority score: <strong>${event.priorityScore}</strong></p>`;
      return {
        subject: `Waitlist join · ${clinic}`,
        text,
        html,
      };
    }
    case 'waitlist.invited': {
      const respondBy = (() => {
        if (!event.respondBy) {
          return 'unspecified';
        }
        const date = new Date(event.respondBy);
        return Number.isNaN(date.getTime()) ? 'unspecified' : date.toISOString();
      })();
      const text = `Patient ${patient} has been invited from the waitlist for ${clinic}. Entry ${event.entryId}. Respond by ${respondBy}.`;
      const html = `<p>Patient <strong>${patient}</strong> invited from the waitlist for <strong>${clinic}</strong>.</p><p>Entry: <strong>${event.entryId}</strong><br/>Respond by: <strong>${respondBy}</strong></p>`;
      return {
        subject: `Waitlist invite · ${clinic}`,
        text,
        html,
      };
    }
    case 'waitlist.promoted': {
      const text = `Patient ${patient} promoted from the waitlist for ${clinic}. Appointment ${event.appointmentId}.`;
      const html = `<p>Patient <strong>${patient}</strong> promoted from the waitlist for <strong>${clinic}</strong>.</p><p>Appointment: <strong>${event.appointmentId}</strong></p>`;
      return {
        subject: `Waitlist promotion · ${clinic}`,
        text,
        html,
      };
    }
    case 'waitlist.expired': {
      const text = `Waitlist entry ${event.entryId} for ${patient} at ${clinic} expired automatically.`;
      const html = `<p>Waitlist entry <strong>${event.entryId}</strong> for <strong>${patient}</strong> at <strong>${clinic}</strong> expired automatically.</p>`;
      return {
        subject: `Waitlist expired · ${clinic}`,
        text,
        html,
      };
    }
    case 'waitlist.cancelled': {
      const reason = event.reason ? ` Reason: ${event.reason}.` : '';
      const text = `Waitlist entry ${event.entryId} for ${patient} at ${clinic} was cancelled.${reason}`;
      const html = `<p>Waitlist entry <strong>${event.entryId}</strong> for <strong>${patient}</strong> at <strong>${clinic}</strong> was cancelled.</p>${reason ? `<p>${reason}</p>` : ''}`;
      return {
        subject: `Waitlist cancelled · ${clinic}`,
        text,
        html,
      };
    }
    default:
      return null;
  }
};

const notifyOps = async (event: WaitlistEvent, logger: Logger) => {
  const message = buildOpsMessage(event);
  if (!message) {
    return;
  }

  await sendMail(logger, {
    to: 'ops@illajwala.com',
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
};

export const registerWaitlistWorker = async ({ logger }: RegisterWaitlistWorkerOptions) => {
  const subscriber = createEventSubscriber({
    queueGroup: 'messaging-service',
  });

  await subscriber.connect();

  // Subscribe to all waitlist event types
  const waitlistEventTypes: Array<WaitlistEvent['type']> = [
    'waitlist.joined',
    'waitlist.invited',
    'waitlist.promoted',
    'waitlist.expired',
    'waitlist.cancelled',
  ];

  for (const eventType of waitlistEventTypes) {
    await subscriber.subscribe<WaitlistEvent>(eventType, async (event: WaitlistEvent) => {
      try {
        logger.info({ eventType: event.type, entryId: event.entryId }, 'Processing waitlist event');

        await Promise.all([
          sendWaitlistEmail(event, logger),
          sendWaitlistSms(event, logger),
          sendWaitlistWhatsapp(event, logger),
          notifyOps(event, logger),
        ]);

        logger.debug({ eventType: event.type }, 'Waitlist event processed successfully');
      } catch (error) {
        logger.error({ eventType: event.type, error }, 'Failed to process waitlist event');
        // In NATS, there's no dead letter queue, so we just log the error
      }
    });
  }

  logger.info('Waitlist worker subscribed to NATS events');

  return {
    subscriber,
    shutdown: async () => {
      await subscriber.disconnect();
      logger.info('Waitlist worker disconnected');
    },
  };
};
