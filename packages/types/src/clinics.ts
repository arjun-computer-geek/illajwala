import { z } from "zod";
import { objectIdSchema, tenantIdSchema } from "./common";

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

export const clinicSchema = z.object({
  _id: objectIdSchema,
  tenantId: tenantIdSchema,
  name: z.string(),
  slug: z.string(),
  timezone: z.string(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  capacity: capacityRulesSchema,
  waitlistOverrides: waitlistOverridesSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createClinicSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  timezone: z.string().min(1).default("Asia/Kolkata"),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  capacity: capacityRulesSchema,
  waitlistOverrides: waitlistOverridesSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateClinicSchema = createClinicSchema.partial();

export type Clinic = z.infer<typeof clinicSchema>;
export type CreateClinicInput = z.infer<typeof createClinicSchema>;
export type UpdateClinicInput = z.infer<typeof updateClinicSchema>;
export type ClinicCapacityRules = z.infer<typeof capacityRulesSchema>;
export type ClinicWaitlistOverrides = z.infer<typeof waitlistOverridesSchema>;

