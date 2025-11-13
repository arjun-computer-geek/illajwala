"use strict";

import { Worker, type Queue } from "bullmq";
import type IORedis from "ioredis";
import type { Logger } from "pino";
import type { NotificationChannel } from "@illajwala/types";
import { sendMail } from "../notifications/mailer";

type NotificationResendJob = {
  tenantId: string;
  auditId: string;
  channel: NotificationChannel;
  payload: string;
  reason?: string | null;
};

const parsePayload = (payload: string) => {
  try {
    return JSON.parse(payload) as Record<string, unknown>;
  } catch (error) {
    throw new Error(`Invalid payload JSON: ${(error as Error).message}`);
  }
};

type RegisterNotificationResendWorkerOptions = {
  connection: IORedis;
  logger: Logger;
  queue: Queue<NotificationResendJob>;
};

export const registerNotificationResendWorker = ({
  connection,
  logger,
  queue,
}: RegisterNotificationResendWorkerOptions): Worker<NotificationResendJob> => {
  const worker = new Worker<NotificationResendJob>(
    queue.name,
    async (job) => {
      logger.info({
        jobId: job.id,
        tenantId: job.data.tenantId,
        channel: job.data.channel,
        auditId: job.data.auditId,
        reason: job.data.reason,
      }, "Processing notification resend");

      const parsed = parsePayload(job.data.payload);

      switch (job.data.channel) {
        case "email": {
          const to = typeof parsed.to === "string" ? parsed.to : undefined;
          const subject = typeof parsed.subject === "string" ? parsed.subject : undefined;
          const html = typeof parsed.html === "string" ? parsed.html : undefined;
          const text = typeof parsed.text === "string" ? parsed.text : undefined;

          if (!to || !subject || (!html && !text)) {
            throw new Error("Email resend payload requires to, subject, and html or text fields");
          }

          await sendMail(logger, {
            to,
            subject,
            html: html ?? text ?? "",
            text: text ?? html ?? "",
          });
          break;
        }
        case "sms": {
          const to = typeof parsed.to === "string" ? parsed.to : undefined;
          const message = typeof parsed.message === "string" ? parsed.message : undefined;
          if (!to || !message) {
            throw new Error("SMS resend payload requires to and message fields");
          }
          logger.info({ to, message }, "SMS resend dispatched (sandbox)");
          break;
        }
        case "whatsapp": {
          const to = typeof parsed.to === "string" ? parsed.to : undefined;
          const message = typeof parsed.message === "string" ? parsed.message : undefined;
          if (!to || !message) {
            throw new Error("WhatsApp resend payload requires to and message fields");
          }
          logger.info({ to, message }, "WhatsApp resend dispatched (sandbox)");
          break;
        }
        default:
          throw new Error(`Unsupported channel ${job.data.channel as string}`);
      }
    },
    {
      connection,
      concurrency: 5,
    }
  );

  worker.on("failed", (...args: any[]) => {
    const [job, error] = args as [{ id?: string; data?: NotificationResendJob } | null, unknown];
    logger.error(
      { jobId: job?.id, channel: job?.data?.channel, auditId: job?.data?.auditId, error },
      "Failed to resend notification"
    );
  });

  return worker;
};


