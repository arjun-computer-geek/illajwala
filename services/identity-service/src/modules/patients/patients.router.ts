import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import {
  handleAddDependent,
  handleGetProfile,
  handleGetNotificationPreferences,
  handleRemoveDependent,
  handleUpdateNotificationPreferences,
  handleUpdateProfile,
} from './patients.controller';
import { requireAuth, validateRequest } from '../../middlewares';
import {
  addDependentSchema,
  updateNotificationPreferencesSchema,
  updatePatientSchema,
} from './patient.schema';

export const patientRouter: ExpressRouter = Router();

patientRouter.get('/me', requireAuth(['patient']), handleGetProfile);
patientRouter.patch(
  '/me',
  requireAuth(['patient']),
  validateRequest({ body: updatePatientSchema }),
  handleUpdateProfile,
);
patientRouter.get('/me/preferences', requireAuth(['patient']), handleGetNotificationPreferences);
patientRouter.patch(
  '/me/preferences',
  requireAuth(['patient']),
  validateRequest({ body: updateNotificationPreferencesSchema }),
  handleUpdateNotificationPreferences,
);
patientRouter.post(
  '/me/dependents',
  requireAuth(['patient']),
  validateRequest({ body: addDependentSchema }),
  handleAddDependent,
);
patientRouter.delete('/me/dependents/:name', requireAuth(['patient']), handleRemoveDependent);
