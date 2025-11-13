import { z } from "zod";
import { doctorSchema } from "./doctors";
import { patientProfileSchema } from "./patients";
import { adminSchema } from "./admin";

const baseAuthResponseSchema = z.object({
  token: z.string(),
  refreshToken: z.string().optional(),
});

export const registerPatientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const loginPatientSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginDoctorSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(8).optional(),
});

export const loginAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const patientAuthResponseSchema = baseAuthResponseSchema.extend({
  role: z.literal("patient"),
  patient: patientProfileSchema,
});

export const doctorAuthResponseSchema = baseAuthResponseSchema.extend({
  role: z.literal("doctor"),
  doctor: doctorSchema,
});

export const adminAuthResponseSchema = baseAuthResponseSchema.extend({
  role: z.literal("admin"),
  admin: adminSchema,
});

export const tokenRefreshResponseSchema = z.union([
  patientAuthResponseSchema.omit({ refreshToken: true }),
  doctorAuthResponseSchema.omit({ refreshToken: true }),
  adminAuthResponseSchema.omit({ refreshToken: true }),
]);

export type RegisterPatientInput = z.infer<typeof registerPatientSchema>;
export type LoginPatientInput = z.infer<typeof loginPatientSchema>;
export type LoginDoctorInput = z.infer<typeof loginDoctorSchema>;
export type LoginAdminInput = z.infer<typeof loginAdminSchema>;
export type PatientAuthResponse = z.infer<typeof patientAuthResponseSchema>;
export type DoctorAuthResponse = z.infer<typeof doctorAuthResponseSchema>;
export type AdminAuthResponse = z.infer<typeof adminAuthResponseSchema>;
export type TokenRefreshResponse = z.infer<typeof tokenRefreshResponseSchema>;

