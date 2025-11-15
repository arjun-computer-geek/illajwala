import { Router } from 'express';
import { analyticsRouter } from '../analytics/analytics.router';
import { statsRouter } from '../stats/stats.router';
import { apiRateLimit } from '../../middlewares';

export const rootRouter: Router = Router();

// Apply general API rate limiting to all routes
rootRouter.use(apiRateLimit);

rootRouter.use('/analytics', analyticsRouter);
rootRouter.use('/stats', statsRouter);
