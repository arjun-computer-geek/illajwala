'use strict';

import type { Request, Response, RequestHandler } from 'express';
import { successResponse, catchAsync, requireTenantId } from '../../utils';
import { getServiceClients } from '../../config/service-clients';
import type { AuthenticatedRequest } from '../../utils';

export const handleGetOpsPulse: RequestHandler = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = requireTenantId(req);
    const { analytics } = getServiceClients(req);
    const metrics = await analytics.getOpsPulse(tenantId);
    return res.json(successResponse(metrics));
  },
);

export const handleGetOpsSeries: RequestHandler = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = requireTenantId(req);
    const query = req.query as { days?: string };
    const days = query.days ? parseInt(query.days, 10) : 14;
    const { analytics } = getServiceClients(req);
    const series = await analytics.getOpsSeries(tenantId, days);
    return res.json(successResponse(series));
  },
);

export const handleGetSLAMetrics: RequestHandler = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = requireTenantId(req);
    const query = req.query as { startDate?: string; endDate?: string };
    const { analytics } = getServiceClients(req);
    const metrics = await analytics.getSLAMetrics(tenantId, query.startDate, query.endDate);
    return res.json(successResponse(metrics));
  },
);

export const handleGetClinicMetrics: RequestHandler = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = requireTenantId(req);
    const query = req.query as { clinicId?: string };
    const { analytics } = getServiceClients(req);
    const metrics = await analytics.getClinicMetrics(tenantId, query.clinicId);
    return res.json(successResponse(metrics));
  },
);
