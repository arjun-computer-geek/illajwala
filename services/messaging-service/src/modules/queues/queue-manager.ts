import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import pino from 'pino';
import type { ConsultationEvent } from '../types/consultation-event';
import { env } from '../../config/env';
import { registerNotificationResendWorker } from '../workers/notification-resend.worker';
import type { NotificationChannel } from '@illajwala/types';
import type { WaitlistEvent } from '../types/waitlist-event';
import { recordQueueDepth } from '../metrics';

/**
 * Queue manager centralises Redis connections for producers & consumers so that
 * local development can reuse a single ioredis instance. This keeps the worker
 * wiring small while we iterate on event payloads.
 */
export const createQueueManager = () => {
  const connection = new IORedis(env.REDIS_URL);
  const logger = pino({
    name: env.SERVICE_NAME,
    transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
  });

  const consultationQueue = new Queue<ConsultationEvent>('consultation-events', {
    connection,
  });
  const consultationDeadLetterQueue = new Queue<ConsultationEvent>('consultation-events-dlq', {
    connection,
  });
  const notificationResendQueue = new Queue<{
    tenantId: string;
    auditId: string;
    channel: NotificationChannel;
    payload: string;
    reason?: string | null;
  }>('notification-resend', {
    connection,
  });
  const waitlistQueue = new Queue<WaitlistEvent>('waitlist-events', {
    connection,
  });

  // Register workers lazily; this lets future modules plug in additional
  // handlers (email, SMS, WhatsApp) without refactoring the bootstrap.
  // Note: consultation and waitlist workers use NATS event bus, not BullMQ queues.
  const workers: Worker<any>[] = [];
  workers.push(
    registerNotificationResendWorker({
      connection,
      logger,
      queue: notificationResendQueue,
    }),
  );

  const queueApi = consultationQueue as unknown as {
    getJobCounts: (...types: string[]) => Promise<Record<string, number>>;
    close: () => Promise<void>;
  };
  const dlqApi = consultationDeadLetterQueue as unknown as { close: () => Promise<void> };
  const resendQueueApi = notificationResendQueue as unknown as { close: () => Promise<void> };
  const waitlistQueueApi = waitlistQueue as unknown as { close: () => Promise<void> };
  const redisConnection = connection as unknown as { quit: () => Promise<void> };

  const refreshQueueDepth = async () => {
    try {
      const counts = await queueApi.getJobCounts('waiting', 'delayed', 'active');
      const depth = (counts.waiting ?? 0) + (counts.delayed ?? 0) + (counts.active ?? 0);
      recordQueueDepth(depth);
    } catch (error) {
      logger.warn({ error }, 'Unable to refresh consultation queue metrics');
    }
  };

  void refreshQueueDepth();
  const metricsInterval = setInterval(() => {
    void refreshQueueDepth();
  }, 15_000);

  return {
    connection,
    logger,
    consultationQueue,
    consultationDeadLetterQueue,
    notificationResendQueue,
    workers,
    shutdown: async () => {
      clearInterval(metricsInterval);
      await Promise.all(
        workers.map((worker) => (worker as unknown as { close: () => Promise<void> }).close()),
      );
      await queueApi.close();
      await dlqApi.close();
      await resendQueueApi.close();
      await waitlistQueueApi.close();
      await redisConnection.quit();
    },
  };
};
