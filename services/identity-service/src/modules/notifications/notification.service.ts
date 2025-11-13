"use strict";

import type { NotificationChannel, NotificationAuditEntry } from "@illajwala/types";
import { NotificationAuditModel, type NotificationAuditDocument } from "./notification.model";
import { PatientModel } from "../patients/patient.model";
import { publishNotificationResend } from "../events/notification-resend.publisher";

const mapDocumentToEntry = (doc: NotificationAuditDocument): NotificationAuditEntry => ({
  id: String(doc._id),
  channel: doc.channel,
  template: doc.template ?? "custom",
  recipient: doc.recipient ?? "unspecified",
  status: doc.status,
  createdAt: doc.createdAt.toISOString(),
  actor: doc.actor ?? null,
  reason: doc.reason ?? null,
  tenantId: doc.tenantId,
});

export const getNotificationAuditEntries = async (
  tenantId: string,
  limit = 10
): Promise<NotificationAuditEntry[]> => {
  const entries = await NotificationAuditModel.find({ tenantId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .exec();

  return entries.map(mapDocumentToEntry);
};

export const queueNotificationResend = async (payload: {
  tenantId: string;
  channel: NotificationChannel;
  body: string;
  actor?: string | null;
  reason?: string | null;
  replayOf?: string | null;
}): Promise<NotificationAuditEntry> => {
  let template: string | undefined;
  let recipient: string | undefined;

  try {
    const parsed = JSON.parse(payload.body) as Record<string, unknown>;
    if (typeof parsed.template === "string") {
      template = parsed.template;
    }
    if (typeof parsed.recipient === "string") {
      recipient = parsed.recipient;
    } else if (typeof parsed.to === "string") {
      recipient = parsed.to;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("[notifications] Unable to parse notification payload", error);
  }

  const doc = await NotificationAuditModel.create({
    tenantId: payload.tenantId,
    channel: payload.channel,
    payload: payload.body,
    template,
    recipient,
    status: "queued",
    reason: payload.reason,
    actor: payload.actor,
    replayOf: payload.replayOf,
  });

  try {
    await publishNotificationResend({
      auditId: String(doc._id),
      channel: payload.channel,
      payload: payload.body,
      reason: payload.reason ?? null,
      tenantId: payload.tenantId,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[notifications] Unable to enqueue resend job", error);
  }

  return mapDocumentToEntry(doc);
};

export const getNotificationHistoryForPatient = async (
  tenantId: string,
  patientId: string,
  { limit = 20 }: { limit?: number } = {}
): Promise<NotificationAuditEntry[]> => {
  const patient = await PatientModel.findOne({ _id: patientId, tenantId }).select("email phone");
  if (!patient) {
    return [];
  }

  const recipients = [patient.email, patient.phone].filter((value): value is string => Boolean(value));

  if (recipients.length === 0) {
    return [];
  }

  const entries = await NotificationAuditModel.find({
    tenantId,
    recipient: { $in: recipients },
  })
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(limit, 1), 50))
    .exec();

  return entries.map(mapDocumentToEntry);
};


