"use client";

import { adminApiClient } from "../api-client";
import type { NotificationAuditEntry, NotificationChannel } from "@/types/admin";

export const adminNotificationsApi = {
  async getRecentAudit(): Promise<NotificationAuditEntry[]> {
    const response = await adminApiClient.get<{ data: NotificationAuditEntry[] }>("/notifications/audit?limit=10");
    return response.data.data;
  },
  async resendNotification(payload: {
    channel: NotificationChannel;
    payload: string;
    reason?: string;
    replayOf?: string | null;
  }): Promise<void> {
    await adminApiClient.post("/notifications/resend", payload);
  },
};


