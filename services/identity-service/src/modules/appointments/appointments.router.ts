import { Router } from "express";
import {
  handleCreateAppointment,
  handleListAppointments,
  handleUpdateAppointmentStatus,
  handleConfirmAppointmentPayment,
  handleUpdateAppointmentPayment,
} from "./appointments.controller";
import { requireAuth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validate-request";
import {
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  confirmAppointmentPaymentSchema,
  updateAppointmentPaymentSchema,
} from "./appointment.schema";

export const appointmentRouter: Router = Router();

appointmentRouter.get("/", requireAuth(["patient", "doctor", "admin"]), handleListAppointments);
appointmentRouter.post(
  "/",
  requireAuth(["patient", "admin"]),
  validateRequest({ body: createAppointmentSchema }),
  handleCreateAppointment
);
appointmentRouter.patch(
  "/:id/status",
  requireAuth(["doctor", "admin"]),
  validateRequest({ body: updateAppointmentStatusSchema }),
  handleUpdateAppointmentStatus
);
appointmentRouter.post(
  "/:id/payment/confirm",
  requireAuth(["patient", "admin"]),
  validateRequest({ body: confirmAppointmentPaymentSchema }),
  handleConfirmAppointmentPayment
);
appointmentRouter.patch(
  "/:id/payment",
  requireAuth(["admin"]),
  validateRequest({ body: updateAppointmentPaymentSchema }),
  handleUpdateAppointmentPayment
);

