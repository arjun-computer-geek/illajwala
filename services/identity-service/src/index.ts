import { app } from './app';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { env } from './config/env';
import { disconnectEventPublisher } from './modules/events/consultation-events.publisher';
import { disconnectWaitlistEventPublisher } from './modules/events/waitlist-events.publisher';

const startServer = async () => {
  try {
    await connectDatabase();
    await connectRedis();
    app.listen(env.PORT, () => {
      console.info(`🚀 Server running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.info('Shutting down gracefully...');
  await disconnectEventPublisher();
  await disconnectWaitlistEventPublisher();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

void startServer();
