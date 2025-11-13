import { createApp } from "./app";
import { env } from "./config/env";
import { createQueueManager } from "./modules/queues/queue-manager";

/**
 * Service bootstrap:
 * 1. Prepare queue connections (BullMQ).
 * 2. Start the lightweight HTTP server for health checks and manual triggers.
 */
async function bootstrap() {
  const logger = createQueueManager().logger;

  const app = createApp();

  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "Messaging service ready");
  });
}

void bootstrap();


