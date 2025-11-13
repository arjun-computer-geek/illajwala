import { z } from "zod";
import { objectIdSchema } from "./common";

export const consultationEventTypeSchema = z.enum([
  "consultation.checked-in",
  "consultation.in-session",
  "consultation.completed",
  "consultation.no-show",
]);

export const consultationEventSchema = z.object({
  type: consultationEventTypeSchema,
  appointmentId: objectIdSchema,
  doctorId: objectIdSchema,
  doctorName: z.string().optional(),
  patientId: objectIdSchema,
  patientName: z.string().optional(),
  patientEmail: z.string().email().optional(),
  scheduledAt: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type ConsultationEventType = z.infer<typeof consultationEventTypeSchema>;
export type ConsultationEvent = z.infer<typeof consultationEventSchema>;


