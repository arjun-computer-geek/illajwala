import { z } from 'zod';
import type {
  ConsultationEvent,
  ConsultationEventType,
  WaitlistEvent,
  WaitlistEventType,
} from '@illajwala/types';

// Payment event types
export const paymentEventTypeSchema = z.enum([
  'payment.created',
  'payment.captured',
  'payment.failed',
  'payment.refunded',
]);

export type PaymentEventType = z.infer<typeof paymentEventTypeSchema>;

export const paymentEventSchema = z.object({
  type: paymentEventTypeSchema,
  tenantId: z.string(),
  orderId: z.string(),
  paymentId: z.string().optional(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(['pending', 'authorized', 'captured', 'failed', 'refunded']),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string(),
});

export type PaymentEvent = z.infer<typeof paymentEventSchema>;

// Appointment event types
export const appointmentEventTypeSchema = z.enum([
  'appointment.created',
  'appointment.confirmed',
  'appointment.cancelled',
  'appointment.completed',
  'appointment.status.changed',
]);

export type AppointmentEventType = z.infer<typeof appointmentEventTypeSchema>;

export const appointmentEventSchema = z.object({
  type: appointmentEventTypeSchema,
  tenantId: z.string(),
  appointmentId: z.string(),
  doctorId: z.string(),
  patientId: z.string(),
  clinicId: z.string().optional(),
  status: z.string(),
  previousStatus: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string(),
});

export type AppointmentEvent = z.infer<typeof appointmentEventSchema>;

// Union of all event types
export type Event = ConsultationEvent | WaitlistEvent | PaymentEvent | AppointmentEvent;
export type EventType =
  | ConsultationEventType
  | WaitlistEventType
  | PaymentEventType
  | AppointmentEventType;

// Event subject/topic mapping
export const getEventSubject = (eventType: EventType): string => {
  // Event types already include the prefix, so just use them directly
  // e.g., "consultation.checked-in" -> "consultation.checked-in"
  // e.g., "waitlist.joined" -> "waitlist.joined"
  return eventType;
};
