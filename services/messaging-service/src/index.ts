import { createApp } from './app';
import { env } from './config/env';
import { createLogger } from '@illajwala/shared';
import { registerConsultationWorker } from './modules/workers/consultation.worker';
import { registerWaitlistWorker } from './modules/workers/waitlist.worker';
import { registerPaymentWorker } from './modules/workers/payment.worker';

/**
 * Service bootstrap:
 * 1. Connect to NATS event bus and subscribe to events.
 * 2. Start the lightweight HTTP server for health checks and manual triggers.
 */
async function bootstrap() {
  const logger = createLogger({ isProd: process.env.NODE_ENV === 'production' });

  // Register event workers
  const consultationWorker = await registerConsultationWorker({ logger });
  const waitlistWorker = await registerWaitlistWorker({ logger });
  const paymentWorker = await registerPaymentWorker({ logger });

  const app = createApp();

  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'Messaging service ready');
  });

  const shutdown = async () => {
    logger.info('Shutting down messaging service');
    await Promise.all([
      consultationWorker.shutdown(),
      waitlistWorker.shutdown(),
      paymentWorker.shutdown(),
    ]);
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

void bootstrap();
