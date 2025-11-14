import type { Request, Response, RequestHandler } from 'express';
import { successResponse, catchAsync } from '../../utils';
import { getPlatformOverview } from './stats.service';

export const handleGetPlatformOverview: RequestHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const overview = await getPlatformOverview();
    return res.json(successResponse(overview));
  },
);
