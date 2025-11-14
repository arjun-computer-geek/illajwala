'use strict';

import { Router } from 'express';
import { requireAuth } from '../../middlewares';
import {
  handleGetOpsPulse,
  handleGetOpsSeries,
  handleGetSLAMetrics,
  handleGetClinicMetrics,
} from './analytics.controller';

export const analyticsRouter: Router = Router();

analyticsRouter.get('/ops/pulse', requireAuth(['admin']), handleGetOpsPulse);
analyticsRouter.get('/ops/series', requireAuth(['admin']), handleGetOpsSeries);
analyticsRouter.get('/sla', requireAuth(['admin']), handleGetSLAMetrics);
analyticsRouter.get('/clinics/metrics', requireAuth(['admin']), handleGetClinicMetrics);
