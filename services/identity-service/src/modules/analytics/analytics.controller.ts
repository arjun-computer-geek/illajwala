"use strict";

import type { Request, Response, RequestHandler } from "express";
import { successResponse } from "../../utils/api-response";
import { catchAsync } from "../../utils/catch-async";
import { getOpsAnalyticsSeries, getOpsMetricsSummary } from "./analytics.service";
import { requireTenantId } from "../../utils/tenant";

export const handleGetOpsPulse: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const tenantId = requireTenantId(req);
  const metrics = await getOpsMetricsSummary(tenantId);
  return res.json(successResponse(metrics));
});

export const handleGetOpsSeries: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const tenantId = requireTenantId(req);
  const series = await getOpsAnalyticsSeries(tenantId);
  return res.json(successResponse(series));
});


