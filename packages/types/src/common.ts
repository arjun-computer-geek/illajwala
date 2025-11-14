import { z } from "zod";

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

export const genderSchema = z.enum(["male", "female", "other"]);

export const consultationModeSchema = z.enum(["clinic", "telehealth", "home-visit"]);

export const clinicLocationSchema = z.object({
  name: z.string(),
  address: z.string().optional(),
  city: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const clinicSummarySchema = z.object({
  _id: objectIdSchema,
  name: z.string(),
  slug: z.string(),
  timezone: z.string(),
  city: z.string().optional(),
});

export const ratingSchema = z
  .number()
  .min(0)
  .max(5)
  .nullish();

export const tenantIdSchema = z.string().min(1, "Tenant identifier is required");

export type ObjectIdString = z.infer<typeof objectIdSchema>;
export type Gender = z.infer<typeof genderSchema>;
export type ConsultationMode = z.infer<typeof consultationModeSchema>;
export type ClinicLocation = z.infer<typeof clinicLocationSchema>;
export type ClinicSummary = z.infer<typeof clinicSummarySchema>;
export type TenantId = z.infer<typeof tenantIdSchema>;

