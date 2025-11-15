'use client';

import { createApiClient } from '@illajwala/api-client';
import { adminAppConfig } from '../config';
import { getAdminAuthToken, getAdminTenant } from '../api-client';
import type {
  OpsAnalyticsSeries,
  OpsMetricsSummary,
  SLAMetrics,
  ClinicMetrics,
} from '@illajwala/types';

// Analytics service client
const analyticsApiClient = createApiClient({
  baseURL: adminAppConfig.analyticsServiceUrl,
  getAuthToken: getAdminAuthToken,
  getTenantId: getAdminTenant,
});

export const adminAnalyticsApi = {
  async getOpsPulse(): Promise<OpsMetricsSummary> {
    const response = await analyticsApiClient.get<{ data: OpsMetricsSummary }>(
      '/analytics/ops/pulse',
    );
    return response.data.data;
  },
  async getAnalyticsSeries(): Promise<OpsAnalyticsSeries> {
    const response = await analyticsApiClient.get<{ data: OpsAnalyticsSeries }>(
      '/analytics/ops/series',
    );
    return response.data.data;
  },
  async getSLAMetrics(): Promise<SLAMetrics> {
    const response = await analyticsApiClient.get<{ data: SLAMetrics }>('/analytics/sla');
    return response.data.data;
  },
  async getClinicMetrics(clinicId?: string): Promise<ClinicMetrics[]> {
    const params = clinicId ? { clinicId } : {};
    const response = await analyticsApiClient.get<{ data: ClinicMetrics[] }>(
      '/analytics/clinics/metrics',
      { params },
    );
    return response.data.data;
  },
};
