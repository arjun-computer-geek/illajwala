import { Router } from 'express';
import { requireAuth, validateRequest } from '../../middlewares';
import {
  createClinicSchema,
  updateClinicSchema,
  clinicIdParamSchema,
  listClinicQuerySchema,
} from './clinic.schema';
import {
  handleCreateClinic,
  handleListClinics,
  handleGetClinic,
  handleUpdateClinic,
  handleGetClinicBySlug,
} from './clinics.controller';

export const clinicRouter: Router = Router();

clinicRouter.post(
  '/',
  requireAuth(['admin']),
  validateRequest({ body: createClinicSchema }),
  handleCreateClinic,
);

clinicRouter.get(
  '/',
  requireAuth(['admin']),
  validateRequest({ query: listClinicQuerySchema }),
  handleListClinics,
);

clinicRouter.get(
  '/:id',
  requireAuth(['admin', 'doctor']),
  validateRequest({ params: clinicIdParamSchema }),
  handleGetClinic,
);

clinicRouter.put(
  '/:id',
  requireAuth(['admin']),
  validateRequest({ params: clinicIdParamSchema, body: updateClinicSchema }),
  handleUpdateClinic,
);

clinicRouter.get('/slug/:slug', requireAuth(['admin', 'doctor']), handleGetClinicBySlug);
