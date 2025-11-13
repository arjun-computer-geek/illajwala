import { z } from "zod";

export const createAppointmentSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  scheduledAt: z.coerce.date(),
  mode: z.enum(["clinic", "telehealth", "home-visit"]),
  reasonForVisit: z.string().max(500).optional(),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(["pending-payment", "confirmed", "checked-in", "in-session", "completed", "cancelled", "no-show"]),
  notes: z.string().max(1000).optional(),
  // Consultation metadata is optional so that simple status updates continue to
  // work without providing the full payload. Individual fields are validated to
  // keep the visit workspace consistent across clients.
  consultation: z
    .object({
      startedAt: z.coerce.date().optional(),
      endedAt: z.coerce.date().optional(),
      notes: z.string().max(5000).optional(),
      followUpActions: z.array(z.string().max(500)).optional(),
      vitals: z
        .array(
          z.object({
            label: z.string().min(1).max(100),
            value: z.string().min(1).max(100),
            unit: z.string().max(50).optional(),
          })
        )
        .optional(),
      attachments: z
        .array(
          z.object({
            key: z.string().min(1),
            name: z.string().min(1),
            url: z.string().url().optional(),
            contentType: z.string().max(120).optional(),
            sizeInBytes: z.number().int().nonnegative().optional(),
          })
        )
        .optional(),
    })
    .optional(),
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

