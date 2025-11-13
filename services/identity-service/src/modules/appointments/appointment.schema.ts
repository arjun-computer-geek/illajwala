import { z } from "zod";

export const createAppointmentSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  scheduledAt: z.coerce.date(),
  mode: z.enum(["clinic", "telehealth", "home-visit"]),
  reasonForVisit: z.string().max(500).optional(),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(["pending-payment", "confirmed", "completed", "cancelled"]),
  notes: z.string().max(1000).optional(),
});

export const confirmAppointmentPaymentSchema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1),
});

export const updateAppointmentPaymentSchema = z.object({
  status: z.enum(["pending", "authorized", "captured", "failed"]),
  paymentId: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
export type ConfirmAppointmentPaymentInput = z.infer<typeof confirmAppointmentPaymentSchema>;
export type UpdateAppointmentPaymentInput = z.infer<typeof updateAppointmentPaymentSchema>;

