import type { Logger } from 'pino';
import type { PaymentEvent } from '@illajwala/types';
import { createEventSubscriber } from '@illajwala/event-bus';

type RegisterPaymentWorkerOptions = {
  logger: Logger;
};

/**
 * Worker that subscribes to payment events from NATS event bus and sends
 * payment-related notifications.
 */
export const registerPaymentWorker = async ({ logger }: RegisterPaymentWorkerOptions) => {
  const subscriber = createEventSubscriber({
    queueGroup: 'messaging-service',
  });

  await subscriber.connect();

  // Subscribe to all payment event types
  const paymentEventTypes: Array<PaymentEvent['type']> = [
    'payment.created',
    'payment.captured',
    'payment.failed',
    'payment.refunded',
  ];

  for (const eventType of paymentEventTypes) {
    await subscriber.subscribe<PaymentEvent>(eventType, async (event: PaymentEvent) => {
      try {
        logger.info(
          { eventType: event.type, orderId: event.orderId, paymentId: event.paymentId },
          'Received payment event',
        );

        // TODO: Implement payment notification logic
        // This could send payment confirmation emails, SMS, etc.
        logger.debug({ eventType: event.type }, 'Payment event processed successfully');
      } catch (error) {
        logger.error({ eventType: event.type, error }, 'Failed to handle payment event');
      }
    });
  }

  logger.info('Payment worker subscribed to NATS events');

  return {
    subscriber,
    shutdown: async () => {
      await subscriber.disconnect();
      logger.info('Payment worker disconnected');
    },
  };
};
