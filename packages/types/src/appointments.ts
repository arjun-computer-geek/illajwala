import { z } from "zod";
import { consultationModeSchema, objectIdSchema } from "./common";
import { doctorSchema } from "./doctors";

export const appointmentStatusSchema = z.enum([
  "pending",
  "confirmed",
  "completed",
  "cancelled",
]);

export const appointmentSchema = z.object({
  _id: objectIdSchema,
  doctor: doctorSchema,
  patientId: objectIdSchema,
  status: appointmentStatusSchema,
  scheduledAt: z.string(),
  mode: consultationModeSchema,
  reasonForVisit: z.string().optional(),
  notes: z.string().optional(),
});

export const bookAppointmentSchema = z.object({
  doctorId: objectIdSchema,
  patientId: objectIdSchema,
  scheduledAt: z.string(),
  mode: consultationModeSchema,
  reasonForVisit: z.string().optional(),
});

export type Appointment = z.infer<typeof appointmentSchema>;
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;
export type BookAppointmentPayload = z.infer<typeof bookAppointmentSchema>;

