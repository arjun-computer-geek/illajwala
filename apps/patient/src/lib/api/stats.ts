import { createApiClient } from '@illajwala/api-client';
import { appConfig } from '../config';
import { getAuthToken, getTenantContext } from '../api-client';
import type { ApiResponse, StatsOverview } from '@/types/api';

// Analytics service client for stats
const analyticsApiClient = createApiClient({
  baseURL: appConfig.analyticsServiceUrl,
  getAuthToken: getAuthToken,
  getTenantId: getTenantContext,
});

export const statsApi = {
  overview: async () => {
    const response = await analyticsApiClient.get<ApiResponse<StatsOverview>>('/stats/overview');
    return response.data.data;
  },
};
