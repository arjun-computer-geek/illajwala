import { Router } from 'express';
import { appointmentRouter } from '../appointments/appointments.router';
import { doctorRouter } from '../doctors/doctors.router';
import { patientRouter } from '../patients/patients.router';
import { authRouter } from '../auth/auth.router';
import { paymentsRouter } from '../payments/payments.router';
import { notificationsRouter } from '../notifications/notifications.router';
import { realtimeRouter } from '../realtime/realtime.router';
import { waitlistRouter } from '../waitlists/waitlists.router';
import { clinicRouter } from '../clinics/clinics.router';
import { apiRateLimit } from '../../middlewares';

export const rootRouter: Router = Router();

// Apply general API rate limiting to all routes
rootRouter.use(apiRateLimit);

rootRouter.use('/auth', authRouter);
rootRouter.use('/patients', patientRouter);
// TODO: Remove these routes once inter-service communication is set up
// These modules should be accessed via provider-service, appointment-service, etc.
rootRouter.use('/doctors', doctorRouter);
rootRouter.use('/appointments', appointmentRouter);
rootRouter.use('/payments', paymentsRouter);
rootRouter.use('/notifications', notificationsRouter);
rootRouter.use('/realtime', realtimeRouter);
rootRouter.use('/waitlists', waitlistRouter);
rootRouter.use('/clinics', clinicRouter);
