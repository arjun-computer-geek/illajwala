import { Router } from 'express';
import {
  handleCreateAppointment,
  handleListAppointments,
  handleGetAppointment,
  handleUpdateAppointmentStatus,
  handleConfirmAppointmentPayment,
  handleUpdateAppointmentPayment,
  handleCancelAppointment,
} from './appointments.controller';
import { requireAuth, validateRequest, paymentRateLimit } from '../../middlewares';
import {
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  confirmAppointmentPaymentSchema,
  updateAppointmentPaymentSchema,
} from './appointment.schema';

export const appointmentRouter: Router = Router();

// List appointments (must come before /:id)
appointmentRouter.get('/', requireAuth(['patient', 'doctor', 'admin']), handleListAppointments);

// Create appointment
appointmentRouter.post(
  '/',
  requireAuth(['patient', 'admin']),
  validateRequest({ body: createAppointmentSchema }),
  handleCreateAppointment,
);

// Specific appointment routes (must come after /)
appointmentRouter.patch(
  '/:id/status',
  requireAuth(['doctor', 'admin']),
  validateRequest({ body: updateAppointmentStatusSchema }),
  handleUpdateAppointmentStatus,
);
appointmentRouter.patch(
  '/:id/cancel',
  requireAuth(['patient', 'doctor', 'admin']),
  handleCancelAppointment,
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

// Get appointment by ID (must come last to avoid matching other routes)
appointmentRouter.get('/:id', requireAuth(['patient', 'doctor', 'admin']), handleGetAppointment);
