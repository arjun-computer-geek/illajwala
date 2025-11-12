import { z } from "zod";

export const registerPatientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(8),
});

export const loginPatientSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginDoctorSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(8).optional(),
});

export type RegisterPatientInput = z.infer<typeof registerPatientSchema>;
export type LoginPatientInput = z.infer<typeof loginPatientSchema>;
export type LoginDoctorInput = z.infer<typeof loginDoctorSchema>;

