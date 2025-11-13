"use strict";

import type { Response } from "express";
import { successResponse } from "../../utils/api-response";
import { catchAsync } from "../../utils/catch-async";
import {
  getNotificationAuditEntries,
  getNotificationHistoryForPatient,
  queueNotificationResend,
} from "./notification.service";
import type { AuthenticatedRequest } from "../../middlewares/auth";

export const handleGetNotificationAudit = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const limitParam = req.query.limit;
  const limit = typeof limitParam === "string" ? Math.min(Math.max(Number.parseInt(limitParam, 10) || 10, 1), 50) : 10;

  const entries = await getNotificationAuditEntries(limit);
  return res.json(successResponse(entries));
});

export const handleQueueNotificationResend = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const entry = await queueNotificationResend({
    channel: req.body.channel,
    body: req.body.payload,
    actor: req.user?.id ?? null,
    reason: req.body.reason,
    replayOf: req.body.replayOf,
  });

  return res.status(202).json(successResponse(entry));
});

export const handleGetPatientNotificationHistory = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(200).json(successResponse([]));
  }

  const limitParam = req.query.limit;
  const limit = typeof limitParam === "string" ? Number.parseInt(limitParam, 10) || 20 : 20;

  const entries = await getNotificationHistoryForPatient(req.user.id, { limit });
  return res.json(successResponse(entries));
});


