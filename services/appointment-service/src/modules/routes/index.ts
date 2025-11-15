import { Router } from 'express';
import { appointmentRouter } from '../appointments/appointments.router';
import { waitlistRouter } from '../waitlists/waitlists.router';
import { realtimeRouter } from '../realtime/realtime.router';
import { apiRateLimit } from '../../middlewares';

export const rootRouter: Router = Router();

// Apply general API rate limiting to all routes
rootRouter.use(apiRateLimit);

rootRouter.use('/appointments', appointmentRouter);
rootRouter.use('/waitlists', waitlistRouter);
rootRouter.use('/realtime', realtimeRouter);
