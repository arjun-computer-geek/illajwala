import { Router } from 'express';
import { doctorRouter } from '../doctors/doctors.router';
import { clinicRouter } from '../clinics/clinics.router';
import { apiRateLimit } from '../../middlewares';

export const rootRouter: Router = Router();

// Apply general API rate limiting to all routes
rootRouter.use(apiRateLimit);

rootRouter.use('/doctors', doctorRouter);
rootRouter.use('/clinics', clinicRouter);
