"use strict";

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validate-request";
import {
  handleGetNotificationAudit,
  handleGetPatientNotificationHistory,
  handleQueueNotificationResend,
} from "./notifications.controller";

const resendNotificationSchema = z.object({
  channel: z.enum(["email", "sms", "whatsapp"]),
  payload: z.string().min(1, "payload is required"),
  reason: z.string().min(1).optional(),
  replayOf: z.string().min(1).optional(),
});

export const notificationsRouter: Router = Router();

notificationsRouter.get("/audit", requireAuth(["admin"]), handleGetNotificationAudit);
notificationsRouter.post(
  "/resend",
  requireAuth(["admin"]),
  validateRequest({ body: resendNotificationSchema }),
  handleQueueNotificationResend
);
notificationsRouter.get("/history/me", requireAuth(["patient"]), handleGetPatientNotificationHistory);


