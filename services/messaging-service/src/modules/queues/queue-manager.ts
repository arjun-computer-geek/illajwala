import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import pino from "pino";
import type { ConsultationEvent } from "../types/consultation-event";
import { env } from "../../config/env";
import { registerConsultationWorker } from "../workers/consultation.worker";

/**
 * Queue manager centralises Redis connections for producers & consumers so that
 * local development can reuse a single ioredis instance. This keeps the worker
 * wiring small while we iterate on event payloads.
 */
export const createQueueManager = () => {
  const connection = new IORedis(env.REDIS_URL);
  const logger = pino({
    name: env.SERVICE_NAME,
    transport: env.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
  });

  const consultationQueue = new Queue<ConsultationEvent>("consultation-events", {
    connection,
  });

  // Register workers lazily; this lets future modules plug in additional
  // handlers (email, SMS, WhatsApp) without refactoring the bootstrap.
  const workers: Worker<ConsultationEvent>[] = [];
  workers.push(registerConsultationWorker({ connection, logger, queue: consultationQueue }));

  return {
    connection,
    logger,
    consultationQueue,
    workers,
  };
};


