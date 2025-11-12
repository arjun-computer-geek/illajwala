import { z } from "zod";
import { clinicLocationSchema, genderSchema, objectIdSchema } from "./common";

export const dependentSchema = z.object({
  name: z.string().min(1),
  relationship: z.string().min(1),
  dateOfBirth: z.string().optional(),
  gender: genderSchema.optional(),
});

export const patientProfileSchema = z.object({
  _id: objectIdSchema,
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  dateOfBirth: z.string().optional(),
  gender: genderSchema.optional(),
  medicalHistory: z.array(z.string()).default([]),
  dependents: z.array(dependentSchema).default([]),
  primaryClinic: clinicLocationSchema.optional(),
});

export type Dependent = z.infer<typeof dependentSchema>;
export type PatientProfile = z.infer<typeof patientProfileSchema>;

