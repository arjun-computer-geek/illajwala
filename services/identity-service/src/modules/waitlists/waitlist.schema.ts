import { z } from 'zod';

const objectIdSchema = z.string().min(1);

export const waitlistStatusSchema = z.enum([
  'active',
  'invited',
  'promoted',
  'expired',
  'cancelled',
]);

const requestedWindowSchema = z
  .object({
    start: z.coerce.date().optional(),
    end: z.coerce.date().optional(),
    notes: z.string().max(500).optional(),
  })
  .optional();

export const createWaitlistEntrySchema = z.object({
  patientId: objectIdSchema,
  clinicId: objectIdSchema.optional(),
  doctorId: objectIdSchema.optional(),
  requestedWindow: requestedWindowSchema,
  notes: z.string().max(1000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const listWaitlistQuerySchema = z.object({
  clinicId: objectIdSchema.optional(),
  doctorId: objectIdSchema.optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.enum(['priority', 'createdAt']).optional(),
});

export const updateWaitlistStatusSchema = z.object({
  status: waitlistStatusSchema,
  notes: z.string().max(1000).optional(),
});

export const promoteWaitlistEntrySchema = z.object({
  appointmentId: objectIdSchema,
  notes: z.string().max(1000).optional(),
});

export const upsertWaitlistPolicySchema = z.object({
  clinicId: objectIdSchema.optional(),
  maxQueueSize: z.number().int().positive().optional(),
  autoExpiryHours: z
    .number()
    .int()
    .positive()
    .max(24 * 14)
    .optional(),
  autoPromoteBufferMinutes: z.number().int().positive().optional(),
  priorityWeights: z.record(z.string(), z.number().nonnegative()).optional(),
  notificationTemplateOverrides: z.record(z.string(), z.string()).optional(),
});

export const waitlistIdParamSchema = z.object({
  id: objectIdSchema,
});

export const waitlistPatientParamSchema = z.object({
  patientId: objectIdSchema,
});

export const waitlistPolicyQuerySchema = z.object({
  clinicId: objectIdSchema.optional(),
});

export const bulkUpdateWaitlistStatusSchema = z.object({
  entryIds: z.array(objectIdSchema).min(1).max(50),
  status: waitlistStatusSchema,
  notes: z.string().max(1000).optional(),
});

export const updateWaitlistPrioritySchema = z.object({
  priorityScore: z.number().int().nonnegative(),
  notes: z.string().max(1000).optional(),
});

export type CreateWaitlistEntryInput = z.infer<typeof createWaitlistEntrySchema>;
export type WaitlistStatusValue = z.infer<typeof waitlistStatusSchema>;
export type ListWaitlistQuery = z.infer<typeof listWaitlistQuerySchema>;
export type UpdateWaitlistStatusInput = z.infer<typeof updateWaitlistStatusSchema>;
export type PromoteWaitlistEntryInput = z.infer<typeof promoteWaitlistEntrySchema>;
export type UpsertWaitlistPolicyInput = z.infer<typeof upsertWaitlistPolicySchema>;
export type BulkUpdateWaitlistStatusInput = z.infer<typeof bulkUpdateWaitlistStatusSchema>;
export type UpdateWaitlistPriorityInput = z.infer<typeof updateWaitlistPrioritySchema>;
