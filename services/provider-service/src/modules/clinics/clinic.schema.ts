import { z } from 'zod';

const objectIdSchema = z.string().min(1);

const capacityRulesSchema = z
  .object({
    dailyAppointments: z.number().int().nonnegative().nullable().optional(),
    simultaneousAppointments: z.number().int().nonnegative().nullable().optional(),
    waitlistLimit: z.number().int().nonnegative().nullable().optional(),
  })
  .strict()
  .optional();

const waitlistOverridesSchema = z
  .object({
    maxQueueSize: z.number().int().positive().nullable().optional(),
    autoExpiryHours: z.number().int().positive().nullable().optional(),
    autoPromoteBufferMinutes: z.number().int().positive().nullable().optional(),
  })
  .strict()
  .optional();

export const createClinicSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  timezone: z.string().min(1).default('Asia/Kolkata'),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  capacity: capacityRulesSchema,
  waitlistOverrides: waitlistOverridesSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateClinicSchema = createClinicSchema.partial();

export const clinicIdParamSchema = z.object({
  id: objectIdSchema,
});

export const listClinicQuerySchema = z.object({
  city: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export type CreateClinicInput = z.infer<typeof createClinicSchema>;
export type UpdateClinicInput = z.infer<typeof updateClinicSchema>;
export type ListClinicQuery = z.infer<typeof listClinicQuerySchema>;
