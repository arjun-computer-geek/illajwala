"use strict";

import { Schema, model, type Document } from "mongoose";
import type { NotificationChannel } from "@illajwala/types";

export type NotificationStatus = "queued" | "sent" | "delivered" | "failed";

export interface NotificationAuditDocument extends Document {
  channel: NotificationChannel;
  template?: string | null;
  recipient?: string | null;
  payload: string;
  status: NotificationStatus;
  reason?: string | null;
  actor?: string | null;
  replayOf?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationAuditSchema = new Schema<NotificationAuditDocument>(
  {
    channel: {
      type: String,
      enum: ["email", "sms", "whatsapp"],
      required: true,
    },
    template: { type: String },
    recipient: { type: String },
    payload: { type: String, required: true },
    status: {
      type: String,
      enum: ["queued", "sent", "delivered", "failed"],
      required: true,
      default: "queued",
    },
    reason: { type: String },
    actor: { type: String },
    replayOf: { type: String },
  },
  { timestamps: true }
);

NotificationAuditSchema.index({ createdAt: -1 });

export const NotificationAuditModel = model<NotificationAuditDocument>(
  "NotificationAudit",
  NotificationAuditSchema
);


