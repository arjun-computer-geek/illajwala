import { app } from './app';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { env } from './config/env';
import { disconnectPaymentEventPublisher } from './modules/payments/payment-events.publisher';

const startServer = async () => {
  try {
    await connectDatabase();
    await connectRedis();
    app.listen(env.PORT, () => {
      console.info(`🚀 Payment service running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.info('Shutting down gracefully...');
  await disconnectPaymentEventPublisher();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

void startServer();
