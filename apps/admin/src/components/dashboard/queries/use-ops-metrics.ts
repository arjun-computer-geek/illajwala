"use client";

import { useQuery } from "@tanstack/react-query";
import { adminAnalyticsApi } from "@/lib/api/analytics";
import { adminQueryKeys } from "@/lib/query-keys";

type UseOpsMetricsOptions = {
  enabled?: boolean;
};

export const useOpsMetricsQuery = (options: UseOpsMetricsOptions = {}) =>
  useQuery({
    queryKey: adminQueryKeys.opsMetrics(),
    queryFn: adminAnalyticsApi.getOpsPulse,
    staleTime: 30_000,
    refetchInterval: 60_000,
    enabled: options.enabled ?? true,
  });


