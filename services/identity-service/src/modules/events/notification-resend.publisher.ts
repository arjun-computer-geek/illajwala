"use strict";

import { Queue } from "bullmq";
import type { NotificationChannel } from "@illajwala/types";
import { redis } from "../../config/redis";

const resendQueue = new Queue<NotificationResendJob>("notification-resend", {
  connection: redis,
});

type NotificationResendJob = {
  tenantId: string;
  auditId: string;
  channel: NotificationChannel;
  payload: string;
  reason?: string | null;
};

export const publishNotificationResend = async (job: NotificationResendJob) => {
  await resendQueue.add("notification-resend", job, {
    removeOnComplete: 100,
    removeOnFail: 25,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  });
};


