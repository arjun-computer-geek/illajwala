import { z } from "zod";
import { objectIdSchema, tenantIdSchema } from "./common";
import { notificationPreferencesSchema } from "./patients";

export const consultationEventTypeSchema = z.enum([
  "consultation.checked-in",
  "consultation.in-session",
  "consultation.completed",
  "consultation.no-show",
]);

export const consultationEventSchema = z.object({
  type: consultationEventTypeSchema,
  tenantId: tenantIdSchema,
  appointmentId: objectIdSchema,
  doctorId: objectIdSchema,
  doctorName: z.string().optional(),
  patientId: objectIdSchema,
  patientName: z.string().optional(),
  patientEmail: z.string().email().optional(),
  patientPhone: z.string().optional(),
  scheduledAt: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  notificationPreferences: notificationPreferencesSchema.optional(),
});

export type ConsultationEventType = z.infer<typeof consultationEventTypeSchema>;
export type ConsultationEvent = z.infer<typeof consultationEventSchema>;


