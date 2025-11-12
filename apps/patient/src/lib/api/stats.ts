import { apiClient } from "../api-client";
import type { ApiResponse, StatsOverview } from "@/types/api";

export const statsApi = {
  overview: async () => {
    const response = await apiClient.get<ApiResponse<StatsOverview>>("/stats/overview");
    return response.data.data;
  },
};


