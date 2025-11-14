'use strict';

import type { Request, Response, RequestHandler } from 'express';
import { successResponse } from '../../utils/api-response';
import { catchAsync } from '../../utils/catch-async';
import { getOpsAnalyticsSeries, getOpsMetricsSummary } from './analytics.service';
import { getSLAMetrics } from './sla-analytics.service';
import { getClinicMetrics } from './clinic-metrics.service';
import { requireTenantId } from '../../utils/tenant';

export const handleGetOpsPulse: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const tenantId = requireTenantId(req);
  const metrics = await getOpsMetricsSummary(tenantId);
  return res.json(successResponse(metrics));
});

export const handleGetOpsSeries: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const tenantId = requireTenantId(req);
    const series = await getOpsAnalyticsSeries(tenantId);
    return res.json(successResponse(series));
  },
);

export const handleGetSLAMetrics: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const tenantId = requireTenantId(req);
    const metrics = await getSLAMetrics(tenantId);
    return res.json(successResponse(metrics));
  },
);

export const handleGetClinicMetrics: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const tenantId = requireTenantId(req);
    const query = req.query as { clinicId?: string };
    const metrics = await getClinicMetrics(tenantId, query.clinicId);
    return res.json(successResponse(metrics));
  },
);
