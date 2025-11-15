import { app } from './app';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { env } from './config/env';
import {
  registerConsultationEventSubscriber,
  registerPaymentEventSubscriber,
  registerAppointmentEventSubscriber,
} from './modules/events/event-subscribers';

const startServer = async () => {
  try {
    await connectDatabase();
    await connectRedis();

    // Register event subscribers
    const consultationSubscriber = await registerConsultationEventSubscriber();
    const paymentSubscriber = await registerPaymentEventSubscriber();
    const appointmentSubscriber = await registerAppointmentEventSubscriber();

    app.listen(env.PORT, () => {
      console.info(`🚀 Analytics service running on port ${env.PORT}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.info('Shutting down analytics service...');
      await Promise.all([
        consultationSubscriber.shutdown(),
        paymentSubscriber.shutdown(),
        appointmentSubscriber.shutdown(),
      ]);
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

void startServer();
