import { Router } from "express";
import {
  handleCreateAppointment,
  handleListAppointments,
  handleUpdateAppointmentStatus,
} from "./appointments.controller";
import { requireAuth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validate-request";
import {
  createAppointmentSchema,
  updateAppointmentStatusSchema,
} from "./appointment.schema";

export const appointmentRouter = Router();

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

