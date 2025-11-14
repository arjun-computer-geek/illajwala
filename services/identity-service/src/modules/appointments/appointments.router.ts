import { Router } from 'express';
import {
  handleCreateAppointment,
  handleListAppointments,
  handleUpdateAppointmentStatus,
  handleConfirmAppointmentPayment,
  handleUpdateAppointmentPayment,
} from './appointments.controller';
import { requireAuth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validate-request';
import { paymentRateLimit } from '../../middlewares/rate-limit';
import {
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  confirmAppointmentPaymentSchema,
  updateAppointmentPaymentSchema,
} from './appointment.schema';

export const appointmentRouter: Router = Router();

appointmentRouter.get('/', requireAuth(['patient', 'doctor', 'admin']), handleListAppointments);
appointmentRouter.post(
  '/',
  requireAuth(['patient', 'admin']),
  validateRequest({ body: createAppointmentSchema }),
  handleCreateAppointment,
);
appointmentRouter.patch(
  '/:id/status',
  requireAuth(['doctor', 'admin']),
  validateRequest({ body: updateAppointmentStatusSchema }),
  handleUpdateAppointmentStatus,
);
appointmentRouter.post(
  '/:id/payment/confirm',
  paymentRateLimit,
  requireAuth(['patient', 'admin']),
  validateRequest({ body: confirmAppointmentPaymentSchema }),
  handleConfirmAppointmentPayment,
);
appointmentRouter.patch(
  '/:id/payment',
  paymentRateLimit,
  requireAuth(['admin']),
  validateRequest({ body: updateAppointmentPaymentSchema }),
  handleUpdateAppointmentPayment,
);
