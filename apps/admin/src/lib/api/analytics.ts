"use client";

import { adminApiClient } from "../api-client";
import type { OpsAnalyticsSeries, OpsMetricsSummary } from "@/types/admin";

export const adminAnalyticsApi = {
  async getOpsPulse(): Promise<OpsMetricsSummary> {
    const response = await adminApiClient.get<{ data: OpsMetricsSummary }>("/analytics/ops/pulse");
    return response.data.data;
  },
  async getAnalyticsSeries(): Promise<OpsAnalyticsSeries> {
    const response = await adminApiClient.get<{ data: OpsAnalyticsSeries }>("/analytics/ops/series");
    return response.data.data;
  },
};


