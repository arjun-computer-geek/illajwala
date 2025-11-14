import { createApp } from './app';
import { env } from './config/env';
import { createLogger } from '@illajwala/shared';
import pino from 'pino';
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
  const pinoLogger = pino({
    name: env.SERVICE_NAME,
    transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
  });

  // Register event workers (they expect pino.Logger)
  const consultationWorker = await registerConsultationWorker({ logger: pinoLogger });
  const waitlistWorker = await registerWaitlistWorker({ logger: pinoLogger });
  const paymentWorker = await registerPaymentWorker({ logger: pinoLogger });

  const app = createApp();

  app.listen(env.PORT, () => {
    logger.info('Messaging service ready', { port: env.PORT });
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
