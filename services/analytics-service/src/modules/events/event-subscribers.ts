import { createLogger } from '@illajwala/shared';
import {
  createEventSubscriber,
  type PaymentEvent,
  type AppointmentEvent,
} from '@illajwala/event-bus';
import type { ConsultationEvent } from '@illajwala/types';
import { AppointmentModel } from '../../models/appointment.model';
import { DoctorModel } from '../../models/doctor.model';
import { PatientModel } from '../../models/patient.model';
import { ClinicModel } from '../../models/clinic.model';

const logger = createLogger({ isProd: process.env.NODE_ENV === 'production' });

/**
 * Subscribe to consultation events and update analytics
 */
export const registerConsultationEventSubscriber = async () => {
  const subscriber = createEventSubscriber({
    queueGroup: 'analytics-service',
  });

  await subscriber.connect();

  // Subscribe to consultation events
  const consultationEventTypes: Array<ConsultationEvent['type']> = [
    'consultation.checked-in',
    'consultation.in-session',
    'consultation.completed',
    'consultation.no-show',
  ];

  for (const eventType of consultationEventTypes) {
    await subscriber.subscribe<ConsultationEvent>(eventType, async (event) => {
      try {
        logger.info('Received consultation event', {
          eventType: event.type,
          appointmentId: event.appointmentId,
        });

        // TODO: Update analytics based on consultation events
        // This could update metrics, generate reports, etc.
        logger.debug('Consultation event processed for analytics', {
          eventType: event.type,
        });
      } catch (error) {
        logger.error('Failed to process consultation event for analytics', error as Error, {
          eventType: event.type,
        });
      }
    });
  }

  logger.info('Consultation event subscriber registered');

  return {
    subscriber,
    shutdown: async () => {
      await subscriber.disconnect();
      logger.info('Consultation event subscriber disconnected');
    },
  };
};

/**
 * Subscribe to payment events and update analytics
 */
export const registerPaymentEventSubscriber = async () => {
  const subscriber = createEventSubscriber({
    queueGroup: 'analytics-service',
  });

  await subscriber.connect();

  // Subscribe to payment events
  const paymentEventTypes: Array<PaymentEvent['type']> = [
    'payment.created',
    'payment.captured',
    'payment.failed',
    'payment.refunded',
  ];

  for (const eventType of paymentEventTypes) {
    await subscriber.subscribe<PaymentEvent>(eventType, async (event) => {
      try {
        logger.info('Received payment event', {
          eventType: event.type,
          orderId: event.orderId,
        });

        // TODO: Update analytics based on payment events
        // This could update revenue metrics, payment success rates, etc.
        logger.debug('Payment event processed for analytics', {
          eventType: event.type,
        });
      } catch (error) {
        logger.error('Failed to process payment event for analytics', error as Error, {
          eventType: event.type,
        });
      }
    });
  }

  logger.info('Payment event subscriber registered');

  return {
    subscriber,
    shutdown: async () => {
      await subscriber.disconnect();
      logger.info('Payment event subscriber disconnected');
    },
  };
};

/**
 * Subscribe to appointment events and update analytics
 */
export const registerAppointmentEventSubscriber = async () => {
  const subscriber = createEventSubscriber({
    queueGroup: 'analytics-service',
  });

  await subscriber.connect();

  // Subscribe to appointment events
  const appointmentEventTypes: Array<AppointmentEvent['type']> = [
    'appointment.created',
    'appointment.confirmed',
    'appointment.cancelled',
    'appointment.completed',
    'appointment.status.changed',
  ];

  for (const eventType of appointmentEventTypes) {
    await subscriber.subscribe<AppointmentEvent>(eventType, async (event) => {
      try {
        logger.info('Received appointment event', {
          eventType: event.type,
          appointmentId: event.appointmentId,
        });

        // TODO: Update analytics based on appointment events
        // This could update appointment metrics, booking trends, etc.
        logger.debug('Appointment event processed for analytics', {
          eventType: event.type,
        });
      } catch (error) {
        logger.error('Failed to process appointment event for analytics', error as Error, {
          eventType: event.type,
        });
      }
    });
  }

  logger.info('Appointment event subscriber registered');

  return {
    subscriber,
    shutdown: async () => {
      await subscriber.disconnect();
      logger.info('Appointment event subscriber disconnected');
    },
  };
};
