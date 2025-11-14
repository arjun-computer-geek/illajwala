import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import {
  handleLoginDoctor,
  handleLoginPatient,
  handleRegisterPatient,
  handleLoginAdmin,
  handleRefreshSession,
  handleLogout,
} from './auth.controller';
import { validateRequest } from '../../middlewares/validate-request';
import { loginRateLimit, moderateRateLimit } from '../../middlewares/rate-limit';
import {
  loginDoctorSchema,
  loginPatientSchema,
  loginAdminSchema,
  registerPatientSchema,
} from './auth.schema';

export const authRouter: ExpressRouter = Router();

authRouter.post(
  '/patient/register',
  moderateRateLimit,
  validateRequest({ body: registerPatientSchema }),
  handleRegisterPatient,
);
authRouter.post(
  '/patient/login',
  loginRateLimit,
  validateRequest({ body: loginPatientSchema }),
  handleLoginPatient,
);
authRouter.post(
  '/doctor/login',
  loginRateLimit,
  validateRequest({ body: loginDoctorSchema }),
  handleLoginDoctor,
);
authRouter.post(
  '/admin/login',
  loginRateLimit,
  validateRequest({ body: loginAdminSchema }),
  handleLoginAdmin,
);
authRouter.post('/refresh', moderateRateLimit, handleRefreshSession);
authRouter.post('/logout', moderateRateLimit, handleLogout);
