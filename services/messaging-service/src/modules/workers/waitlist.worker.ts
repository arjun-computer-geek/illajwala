"use strict";

import { Worker, type Queue } from "bullmq";
import type IORedis from "ioredis";
import type { Logger } from "pino";
import type { WaitlistEvent } from "../types/waitlist-event";
import { sendMail } from "../notifications/mailer";
import { sendWaitlistEmail, sendWaitlistSms, sendWaitlistWhatsapp } from "../notifications/waitlist.sender";

type RegisterWaitlistWorkerOptions = {
  connection: IORedis;
  logger: Logger;
  queue: Queue<WaitlistEvent>;
};

type OpsMessage = {
  subject: string;
  text: string;
  html: string;
};

const clinicLabel = (event: WaitlistEvent) =>
  event.clinicName ?? (event.clinicId ? `clinic ${event.clinicId}` : "the clinic");

const patientLabel = (event: WaitlistEvent) => event.patientName ?? event.patientId;

const buildOpsMessage = (event: WaitlistEvent): OpsMessage | null => {
  const clinic = clinicLabel(event);
  const patient = patientLabel(event);

  switch (event.type) {
    case "waitlist.joined": {
      const text = `Patient ${patient} joined the waitlist for ${clinic}. Entry ${event.entryId}. Priority score ${event.priorityScore}.`;
      const html = `<p>Patient <strong>${patient}</strong> joined the waitlist for <strong>${clinic}</strong>.</p><p>Entry: <strong>${event.entryId}</strong><br/>Priority score: <strong>${event.priorityScore}</strong></p>`;
      return {
        subject: `Waitlist join · ${clinic}`,
        text,
        html,
      };
    }
    case "waitlist.invited": {
      const respondBy = (() => {
        if (!event.respondBy) {
          return "unspecified";
        }
        const date = new Date(event.respondBy);
        return Number.isNaN(date.getTime()) ? "unspecified" : date.toISOString();
      })();
      const text = `Patient ${patient} has been invited from the waitlist for ${clinic}. Entry ${event.entryId}. Respond by ${respondBy}.`;
      const html = `<p>Patient <strong>${patient}</strong> invited from the waitlist for <strong>${clinic}</strong>.</p><p>Entry: <strong>${event.entryId}</strong><br/>Respond by: <strong>${respondBy}</strong></p>`;
      return {
        subject: `Waitlist invite · ${clinic}`,
        text,
        html,
      };
    }
    case "waitlist.promoted": {
      const text = `Patient ${patient} promoted from the waitlist for ${clinic}. Appointment ${event.appointmentId}.`;
      const html = `<p>Patient <strong>${patient}</strong> promoted from the waitlist for <strong>${clinic}</strong>.</p><p>Appointment: <strong>${event.appointmentId}</strong></p>`;
      return {
        subject: `Waitlist promotion · ${clinic}`,
        text,
        html,
      };
    }
    case "waitlist.expired": {
      const text = `Waitlist entry ${event.entryId} for ${patient} at ${clinic} expired automatically.`;
      const html = `<p>Waitlist entry <strong>${event.entryId}</strong> for <strong>${patient}</strong> at <strong>${clinic}</strong> expired automatically.</p>`;
      return {
        subject: `Waitlist expired · ${clinic}`,
        text,
        html,
      };
    }
    case "waitlist.cancelled": {
      const reason = event.reason ? ` Reason: ${event.reason}.` : "";
      const text = `Waitlist entry ${event.entryId} for ${patient} at ${clinic} was cancelled.${reason}`;
      const html = `<p>Waitlist entry <strong>${event.entryId}</strong> for <strong>${patient}</strong> at <strong>${clinic}</strong> was cancelled.</p>${reason ? `<p>${reason}</p>` : ""}`;
      return {
        subject: `Waitlist cancelled · ${clinic}`,
        text,
        html,
      };
    }
    default:
      return null;
  }
};

const notifyOps = async (event: WaitlistEvent, logger: Logger) => {
  const message = buildOpsMessage(event);
  if (!message) {
    return;
  }

  await sendMail(logger, {
    to: "ops@illajwala.com",
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
};

export const registerWaitlistWorker = ({
  connection,
  logger,
  queue,
}: RegisterWaitlistWorkerOptions): Worker<WaitlistEvent> => {
  const worker = new Worker<WaitlistEvent>(
    queue.name,
    async (job) => {
      const event = job.data;

      logger.info({ jobId: job.id, eventType: event.type, entryId: event.entryId }, "Processing waitlist event");

      await sendWaitlistEmail(event, logger);
      await sendWaitlistSms(event, logger);
      await sendWaitlistWhatsapp(event, logger);
      await notifyOps(event, logger);
    },
    {
      connection,
      concurrency: 5,
    }
  );

  worker.on("failed", (job: any, error) => {
    logger.error(
      { jobId: job?.id, eventType: job?.data?.type, error },
      "Failed to process waitlist event"
    );
  });

  return worker;
};


