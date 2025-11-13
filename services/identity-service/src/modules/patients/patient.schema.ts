import { z } from "zod";

export const createPatientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(8),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
});

export const updatePatientSchema = createPatientSchema.partial().omit({ password: true });

export const addDependentSchema = z.object({
  name: z.string().min(1),
  relationship: z.string().min(1),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type AddDependentInput = z.infer<typeof addDependentSchema>;

export const updateNotificationPreferencesSchema = z.object({
  emailReminders: z.boolean().optional(),
  smsReminders: z.boolean().optional(),
  whatsappReminders: z.boolean().optional(),
});

export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>;

