import { Worker, type Queue } from "bullmq";
import type IORedis from "ioredis";
import type { Logger } from "pino";
import type { ConsultationEvent } from "../types/consultation-event";
import { sendConsultationEmail } from "../notifications/email.sender";
import { sendConsultationSms } from "../notifications/sms.sender";
import { sendConsultationWhatsapp } from "../notifications/whatsapp.sender";
import { recordJobDuration, recordJobFailure } from "../metrics";

type RegisterConsultationWorkerOptions = {
  connection: IORedis;
  logger: Logger;
  queue: Queue<ConsultationEvent>;
  deadLetterQueue: Queue<ConsultationEvent>;
};

/**
 * Placeholder worker that logs consultation lifecycle updates. Once messaging
 * channels are ready we can fan out to email/SMS/Webhooks from this handler.
 */
export const registerConsultationWorker = ({
  connection,
  logger,
  queue,
  deadLetterQueue,
}: RegisterConsultationWorkerOptions): Worker<ConsultationEvent> => {
  const worker = new Worker<ConsultationEvent>(
    queue.name,
    async (job: { id: string; data: ConsultationEvent }) => {
      logger.info({ jobId: job.id, event: job.data.type }, "Received consultation event");
      const startedAt = Date.now();
      await sendConsultationEmail(job.data, logger);
      await sendConsultationSms(job.data, logger);
      await sendConsultationWhatsapp(job.data, logger);
      recordJobDuration(job.data.type, Date.now() - startedAt);
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
    if (job?.data?.type) {
      recordJobFailure(job.data.type);
    }
    if (job?.data) {
      void deadLetterQueue
        .add(job.data.type ?? "consultation-event", job.data, {
          removeOnComplete: 100,
          attempts: 1,
        })
        .catch((dlqError) => {
          logger.error({ jobId: job?.id, error: dlqError }, "Unable to enqueue consultation event to DLQ");
        });
    }
  });

  return worker;
};


