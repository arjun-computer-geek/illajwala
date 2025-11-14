import { z } from 'zod';
import {
  clinicSummarySchema,
  consultationModeSchema,
  objectIdSchema,
  tenantIdSchema,
} from './common';
import { doctorSchema } from './doctors';
import { patientProfileSchema } from './patients';

// Sprint 3 extends the appointment status machine; keep in sync with the
// backend mongoose schema and front-end label maps.
export const appointmentStatusSchema = z.enum([
  'pending-payment',
  'confirmed',
  'checked-in',
  'in-session',
  'completed',
  'cancelled',
  'no-show',
]);

export const appointmentPaymentStatusSchema = z.enum([
  'pending',
  'authorized',
  'captured',
  'failed',
]);

export const appointmentPaymentEventSchema = z.object({
  type: z.enum([
    'order-created',
    'payment-authorized',
    'payment-captured',
    'payment-failed',
    'webhook-received',
    'manual-update',
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

// Attachments uploaded during the visit (e.g. prescriptions or lab orders).
export const appointmentConsultationAttachmentSchema = z.object({
  key: z.string(),
  name: z.string(),
  url: z.string().url().optional(),
  contentType: z.string().optional(),
  sizeInBytes: z.number().int().nonnegative().optional(),
});

// Lightweight vitals capture so the visit workspace can show latest readings.
export const appointmentConsultationVitalsEntrySchema = z.object({
  label: z.string(),
  value: z.string(),
  unit: z.string().optional(),
});

// Prescription entry for consultation documentation
export const appointmentConsultationPrescriptionSchema = z.object({
  medication: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  duration: z.string().optional(),
  instructions: z.string().optional(),
  refills: z.number().int().nonnegative().optional(),
});

// Follow-up appointment scheduling
export const appointmentConsultationFollowUpSchema = z.object({
  action: z.string(),
  scheduledAt: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  completed: z.boolean().optional(),
});

// Referral entry for consultation documentation
export const appointmentConsultationReferralSchema = z.object({
  type: z.enum(['specialist', 'lab', 'imaging', 'therapy', 'other']),
  specialty: z.string().optional(),
  provider: z.string().optional(),
  reason: z.string(),
  priority: z.enum(['routine', 'urgent', 'emergency']).optional(),
  notes: z.string().optional(),
});

export const appointmentConsultationSchema = z.object({
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
  notes: z.string().optional(),
  followUpActions: z.array(z.string()).optional(),
  followUps: z.array(appointmentConsultationFollowUpSchema).optional(),
  attachments: z.array(appointmentConsultationAttachmentSchema).optional(),
  vitals: z.array(appointmentConsultationVitalsEntrySchema).optional(),
  prescriptions: z.array(appointmentConsultationPrescriptionSchema).optional(),
  referrals: z.array(appointmentConsultationReferralSchema).optional(),
  lastEditedBy: objectIdSchema.optional(),
});

export const appointmentSchema = z.object({
  _id: objectIdSchema,
  tenantId: tenantIdSchema,
  doctor: doctorSchema,
  patientId: objectIdSchema,
  // Populated subset of patient info useful for dashboards and reminders.
  patient: patientProfileSchema
    .pick({
      _id: true,
      name: true,
      email: true,
      phone: true,
    })
    .partial()
    .optional(),
  clinicId: objectIdSchema.optional(),
  clinic: clinicSummarySchema.optional(),
  status: appointmentStatusSchema,
  scheduledAt: z.string(),
  mode: consultationModeSchema,
  reasonForVisit: z.string().optional(),
  notes: z.string().optional(),
  consultation: appointmentConsultationSchema.optional(),
  payment: appointmentPaymentSchema.optional(),
});

export const bookAppointmentSchema = z.object({
  doctorId: objectIdSchema,
  patientId: objectIdSchema,
  clinicId: objectIdSchema.optional(),
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
export type AppointmentConsultation = z.infer<typeof appointmentConsultationSchema>;
export type BookAppointmentPayload = z.infer<typeof bookAppointmentSchema>;
export type AppointmentPaymentOrder = z.infer<typeof appointmentPaymentOrderSchema>;
export type BookAppointmentResponse = z.infer<typeof bookAppointmentResponseSchema>;
export type ConfirmAppointmentPaymentInput = z.infer<typeof confirmAppointmentPaymentSchema>;
