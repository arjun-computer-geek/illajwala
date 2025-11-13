import { createApp } from "./app";
import { env } from "./config/env";
import { createQueueManager } from "./modules/queues/queue-manager";

/**
 * Service bootstrap:
 * 1. Prepare queue connections (BullMQ).
 * 2. Start the lightweight HTTP server for health checks and manual triggers.
 */
async function bootstrap() {
  const queueManager = createQueueManager();
  const { logger } = queueManager;

  const app = createApp();

  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "Messaging service ready");
  });

  const shutdown = async () => {
    logger.info("Shutting down messaging service");
    await queueManager.shutdown();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

void bootstrap();


