"use client";

import { useQuery } from "@tanstack/react-query";
import { adminAnalyticsApi } from "@/lib/api/analytics";
import { adminQueryKeys } from "@/lib/query-keys";

export const useOpsAnalyticsQuery = () =>
  useQuery({
    queryKey: adminQueryKeys.opsAnalytics(),
    queryFn: adminAnalyticsApi.getAnalyticsSeries,
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
  });


