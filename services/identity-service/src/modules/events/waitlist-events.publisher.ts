import type { WaitlistEvent } from '@illajwala/types';
import { createEventPublisher } from '@illajwala/event-bus';

// Create a singleton event publisher instance
let eventPublisher: ReturnType<typeof createEventPublisher> | null = null;

const getEventPublisher = async () => {
  if (!eventPublisher) {
    eventPublisher = createEventPublisher();
    await eventPublisher.connect();
  }
  return eventPublisher;
};

export const publishWaitlistEvent = async (payload: WaitlistEvent) => {
  const publisher = await getEventPublisher();
  await publisher.publish(payload);
};

// Graceful shutdown
export const disconnectWaitlistEventPublisher = async () => {
  if (eventPublisher) {
    await eventPublisher.disconnect();
    eventPublisher = null;
  }
};
