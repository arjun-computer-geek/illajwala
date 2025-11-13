import { z } from "zod";
import { consultationModeSchema, objectIdSchema } from "./common";
import { doctorSchema } from "./doctors";

export const appointmentStatusSchema = z.enum([
  "pending-payment",
  "confirmed",
  "completed",
  "cancelled",
]);

export const appointmentPaymentStatusSchema = z.enum(["pending", "authorized", "captured", "failed"]);

export const appointmentPaymentEventSchema = z.object({
  type: z.enum([
    "order-created",
    "payment-authorized",
    "payment-captured",
    "payment-failed",
    "webhook-received",
    "manual-update",
  ]),
  payload: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string(),
});

export const appointmentPaymentSchema = z.object({
  orderId: z.string(),
  status: appointmentPaymentStatusSchema,
  amount: z.number(),
  currency: z.string(),
  receipt: z.string().optional(),
  paymentId: z.string().optional(),
  signature: z.string().optional(),
  intentExpiresAt: z.string().optional(),
  capturedAt: z.string().optional(),
  failedAt: z.string().optional(),
  history: z.array(appointmentPaymentEventSchema).optional(),
});

export const appointmentSchema = z.object({
  _id: objectIdSchema,
  doctor: doctorSchema,
  patientId: objectIdSchema,
  status: appointmentStatusSchema,
  scheduledAt: z.string(),
  mode: consultationModeSchema,
  reasonForVisit: z.string().optional(),
  notes: z.string().optional(),
  payment: appointmentPaymentSchema.optional(),
});

export const bookAppointmentSchema = z.object({
  doctorId: objectIdSchema,
  patientId: objectIdSchema,
  scheduledAt: z.string(),
  mode: consultationModeSchema,
  reasonForVisit: z.string().optional(),
});

export const appointmentPaymentOrderSchema = z.object({
  orderId: z.string(),
  amount: z.number(),
  currency: z.string(),
  keyId: z.string(),
  receipt: z.string().optional(),
  intentExpiresAt: z.string().optional(),
});

export const bookAppointmentResponseSchema = z.object({
  appointment: appointmentSchema,
  payment: appointmentPaymentOrderSchema.nullable(),
});

export const confirmAppointmentPaymentSchema = z.object({
  orderId: z.string(),
  paymentId: z.string(),
  signature: z.string(),
});

export type Appointment = z.infer<typeof appointmentSchema>;
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;
export type AppointmentPaymentStatus = z.infer<typeof appointmentPaymentStatusSchema>;
export type AppointmentPayment = z.infer<typeof appointmentPaymentSchema>;
export type BookAppointmentPayload = z.infer<typeof bookAppointmentSchema>;
export type AppointmentPaymentOrder = z.infer<typeof appointmentPaymentOrderSchema>;
export type BookAppointmentResponse = z.infer<typeof bookAppointmentResponseSchema>;
export type ConfirmAppointmentPaymentInput = z.infer<typeof confirmAppointmentPaymentSchema>;

