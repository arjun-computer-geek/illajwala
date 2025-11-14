import { createEventPublisher } from '@illajwala/event-bus';
import type { PaymentEvent } from '@illajwala/event-bus';

// Create a singleton event publisher instance
let eventPublisher: ReturnType<typeof createEventPublisher> | null = null;

const getEventPublisher = async () => {
  if (!eventPublisher) {
    eventPublisher = createEventPublisher();
    await eventPublisher.connect();
  }
  return eventPublisher;
};

type PublishPaymentEventInput = {
  type: 'payment.created' | 'payment.captured' | 'payment.failed' | 'payment.refunded';
  tenantId: string;
  orderId: string;
  paymentId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded';
  metadata?: Record<string, unknown>;
};

export const publishPaymentEvent = async (payload: PublishPaymentEventInput) => {
  const publisher = await getEventPublisher();

  const event: PaymentEvent = {
    type: payload.type,
    tenantId: payload.tenantId,
    orderId: payload.orderId,
    paymentId: payload.paymentId,
    amount: payload.amount,
    currency: payload.currency,
    status: payload.status,
    metadata: payload.metadata,
    createdAt: new Date().toISOString(),
  };

  await publisher.publish(event);
};

// Graceful shutdown
export const disconnectPaymentEventPublisher = async () => {
  if (eventPublisher) {
    await eventPublisher.disconnect();
    eventPublisher = null;
  }
};
