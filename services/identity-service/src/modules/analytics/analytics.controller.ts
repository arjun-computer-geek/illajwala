"use strict";

import type { Request, Response, RequestHandler } from "express";
import { successResponse } from "../../utils/api-response";
import { catchAsync } from "../../utils/catch-async";
import { getOpsAnalyticsSeries, getOpsMetricsSummary } from "./analytics.service";

export const handleGetOpsPulse: RequestHandler = catchAsync(async (_req: Request, res: Response) => {
  const metrics = await getOpsMetricsSummary();
  return res.json(successResponse(metrics));
});

export const handleGetOpsSeries: RequestHandler = catchAsync(async (_req: Request, res: Response) => {
  const series = await getOpsAnalyticsSeries();
  return res.json(successResponse(series));
});


