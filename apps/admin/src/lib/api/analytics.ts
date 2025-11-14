'use client';

import { adminApiClient } from '../api-client';
import type {
  OpsAnalyticsSeries,
  OpsMetricsSummary,
  SLAMetrics,
  ClinicMetrics,
} from '@illajwala/types';

export const adminAnalyticsApi = {
  async getOpsPulse(): Promise<OpsMetricsSummary> {
    const response = await adminApiClient.get<{ data: OpsMetricsSummary }>('/analytics/ops/pulse');
    return response.data.data;
  },
  async getAnalyticsSeries(): Promise<OpsAnalyticsSeries> {
    const response = await adminApiClient.get<{ data: OpsAnalyticsSeries }>(
      '/analytics/ops/series',
    );
    return response.data.data;
  },
  async getSLAMetrics(): Promise<SLAMetrics> {
    const response = await adminApiClient.get<{ data: SLAMetrics }>('/analytics/sla');
    return response.data.data;
  },
  async getClinicMetrics(clinicId?: string): Promise<ClinicMetrics[]> {
    const params = clinicId ? { clinicId } : {};
    const response = await adminApiClient.get<{ data: ClinicMetrics[] }>(
      '/analytics/clinics/metrics',
      { params },
    );
    return response.data.data;
  },
};
