import { z } from 'zod';
import { objectIdSchema, tenantIdSchema } from './common';
import type { PatientNotificationPreferences } from './patients';

type WaitlistEventBase = {
  tenantId: string;
  entryId: string;
  clinicId?: string | null;
  clinicName?: string | null;
  doctorId?: string | null;
  patientId: string;
  patientName?: string | null;
  patientEmail?: string | null;
  patientPhone?: string | null;
  notificationPreferences?: PatientNotificationPreferences;
};

export type WaitlistJoinedEvent = WaitlistEventBase & {
  type: 'waitlist.joined';
  priorityScore: number;
  requestedWindow?:
    | {
        start?: string | null;
        end?: string | null;
        notes?: string | null;
      }
    | undefined;
  metadata?: Record<string, unknown>;
};

export type WaitlistInvitedEvent = WaitlistEventBase & {
  type: 'waitlist.invited';
  respondBy?: string | null;
};

export type WaitlistPromotedEvent = WaitlistEventBase & {
  type: 'waitlist.promoted';
  appointmentId: string;
};

export type WaitlistExpiredEvent = WaitlistEventBase & {
  type: 'waitlist.expired';
};

export type WaitlistCancelledEvent = WaitlistEventBase & {
  type: 'waitlist.cancelled';
  reason?: string | null;
};

export type WaitlistEventType =
  | 'waitlist.joined'
  | 'waitlist.invited'
  | 'waitlist.promoted'
  | 'waitlist.expired'
  | 'waitlist.cancelled';

export type WaitlistEvent =
  | WaitlistJoinedEvent
  | WaitlistInvitedEvent
  | WaitlistPromotedEvent
  | WaitlistExpiredEvent
  | WaitlistCancelledEvent;

export const waitlistStatusSchema = z.enum([
  'active',
  'invited',
  'promoted',
  'expired',
  'cancelled',
]);

export const waitlistRequestedWindowSchema = z
  .object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
    notes: z.string().max(500).optional(),
  })
  .strict();

export const waitlistAuditEntrySchema = z
  .object({
    action: z.enum([
      'created',
      'updated',
      'status-change',
      'promotion',
      'expiration',
      'cancellation',
    ]),
    actorId: objectIdSchema.optional(),
    notes: z.string().optional(),
    createdAt: z.string(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const waitlistEntrySchema = z
  .object({
    _id: objectIdSchema,
    tenantId: tenantIdSchema,
    clinicId: objectIdSchema.optional(),
    doctorId: objectIdSchema.optional(),
    patientId: objectIdSchema,
    status: waitlistStatusSchema,
    priorityScore: z.number(),
    requestedWindow: waitlistRequestedWindowSchema.optional(),
    notes: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    expiresAt: z.string().optional(),
    promotedAppointmentId: objectIdSchema.optional(),
    audit: z.array(waitlistAuditEntrySchema).default([]),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict();

export const waitlistPolicySchema = z
  .object({
    tenantId: tenantIdSchema,
    clinicId: objectIdSchema.optional(),
    maxQueueSize: z.number().int().positive().default(250),
    autoExpiryHours: z
      .number()
      .int()
      .positive()
      .max(24 * 14)
      .default(72),
    autoPromoteBufferMinutes: z.number().int().positive().default(30),
    priorityWeights: z
      .object({
        waitTime: z.number().nonnegative().default(1),
        membershipLevel: z.number().nonnegative().default(0),
        chronicCondition: z.number().nonnegative().default(0),
      })
      .partial()
      .default({}),
    notificationTemplateOverrides: z.record(z.string(), z.string()).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .strict();

export type WaitlistStatus = z.infer<typeof waitlistStatusSchema>;
export type WaitlistRequestedWindow = z.infer<typeof waitlistRequestedWindowSchema>;
export type WaitlistAuditEntry = z.infer<typeof waitlistAuditEntrySchema>;
export type WaitlistEntry = z.infer<typeof waitlistEntrySchema>;
export type WaitlistPolicy = z.infer<typeof waitlistPolicySchema>;
