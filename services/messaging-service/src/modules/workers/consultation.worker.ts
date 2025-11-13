import { Worker, type Queue } from "bullmq";
import type IORedis from "ioredis";
import type { Logger } from "pino";
import type { ConsultationEvent } from "../types/consultation-event";
import { sendConsultationEmail } from "../notifications/email.sender";

type RegisterConsultationWorkerOptions = {
  connection: IORedis;
  logger: Logger;
  queue: Queue<ConsultationEvent>;
};

/**
 * Placeholder worker that logs consultation lifecycle updates. Once messaging
 * channels are ready we can fan out to email/SMS/Webhooks from this handler.
 */
export const registerConsultationWorker = ({
  connection,
  logger,
  queue,
}: RegisterConsultationWorkerOptions): Worker<ConsultationEvent> => {
  const worker = new Worker<ConsultationEvent>(
    queue.name,
    async (job: { id: string; data: ConsultationEvent }) => {
      logger.info({ jobId: job.id, event: job.data.type }, "Received consultation event");
      await sendConsultationEmail(job.data, logger);
    },
    {
      connection,
      concurrency: 5,
    }
  );

  worker.on("completed", (job: any) => {
    logger.debug({ jobId: job?.id }, "Consultation event processed");
  });

  worker.on("failed", (job: any, error: unknown) => {
    logger.error({ jobId: job?.id, error }, "Failed to handle consultation event");
  });

  return worker;
};


