import { z } from "zod";
import { clinicLocationSchema, genderSchema, objectIdSchema, tenantIdSchema } from "./common";

export const dependentSchema = z.object({
  name: z.string().min(1),
  relationship: z.string().min(1),
  dateOfBirth: z.string().optional(),
  gender: genderSchema.optional(),
});

export const notificationPreferencesSchema = z.object({
  emailReminders: z.boolean().default(true),
  smsReminders: z.boolean().default(true),
  whatsappReminders: z.boolean().default(false),
});

export const patientProfileSchema = z.object({
  _id: objectIdSchema,
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  tenantId: tenantIdSchema,
  dateOfBirth: z.string().optional(),
  gender: genderSchema.optional(),
  medicalHistory: z.array(z.string()).default([]),
  dependents: z.array(dependentSchema).default([]),
  primaryClinic: clinicLocationSchema.optional(),
  notificationPreferences: notificationPreferencesSchema.default({
    emailReminders: true,
    smsReminders: true,
    whatsappReminders: false,
  }),
});

export type Dependent = z.infer<typeof dependentSchema>;
export type PatientProfile = z.infer<typeof patientProfileSchema>;
export type PatientNotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

