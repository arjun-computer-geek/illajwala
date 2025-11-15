import type { Logger } from 'pino';
import type { ConsultationEvent } from '@illajwala/types';
import { createEventSubscriber } from '@illajwala/event-bus';
import { sendConsultationEmail } from '../notifications/email.sender';
import { sendConsultationSms } from '../notifications/sms.sender';
import { sendConsultationWhatsapp } from '../notifications/whatsapp.sender';

type RegisterConsultationWorkerOptions = {
  logger: Logger;
};

/**
 * Worker that subscribes to consultation events from NATS event bus and sends
 * notifications via email, SMS, and WhatsApp.
 */
export const registerConsultationWorker = async ({ logger }: RegisterConsultationWorkerOptions) => {
  const subscriber = createEventSubscriber({
    queueGroup: 'messaging-service',
  });

  await subscriber.connect();

  // Subscribe to all consultation event types
  const consultationEventTypes: Array<ConsultationEvent['type']> = [
    'consultation.checked-in',
    'consultation.in-session',
    'consultation.completed',
    'consultation.no-show',
  ];

  for (const eventType of consultationEventTypes) {
    await subscriber.subscribe<ConsultationEvent>(eventType, async (event: ConsultationEvent) => {
      try {
        logger.info(
          { eventType: event.type, appointmentId: event.appointmentId },
          'Received consultation event',
        );

        await Promise.all([
          sendConsultationEmail(event, logger),
          sendConsultationSms(event, logger),
          sendConsultationWhatsapp(event, logger),
        ]);

        logger.debug({ eventType: event.type }, 'Consultation event processed successfully');
      } catch (error) {
        logger.error({ eventType: event.type, error }, 'Failed to handle consultation event');
        // In NATS, there's no dead letter queue, so we just log the error
        // For production, you might want to implement a retry mechanism or DLQ
      }
    });
  }

  logger.info('Consultation worker subscribed to NATS events');

  return {
    subscriber,
    shutdown: async () => {
      await subscriber.disconnect();
      logger.info('Consultation worker disconnected');
    },
  };
};
