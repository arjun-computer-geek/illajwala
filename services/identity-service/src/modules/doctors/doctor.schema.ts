import { z } from "zod";

export const createDoctorSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(8),
  specialization: z.string().min(1),
  about: z.string().max(2000).optional(),
  languages: z.array(z.string()).default([]),
  consultationModes: z.array(z.enum(["clinic", "telehealth", "home-visit"])).default(["clinic"]),
  fee: z.number().nonnegative().default(0),
  experienceYears: z.number().int().nonnegative().optional(),
  clinicLocations: z
    .array(
      z.object({
        name: z.string(),
        address: z.string(),
        city: z.string(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      })
    )
    .default([]),
});

export const updateDoctorSchema = createDoctorSchema.partial();

export const doctorSearchSchema = z.object({
  query: z.string().optional(),
  specialization: z.string().optional(),
  city: z.string().optional(),
  consultationMode: z.enum(["clinic", "telehealth", "home-visit"]).optional(),
  featured: z.coerce.boolean().optional(),
  sort: z.enum(["rating", "fee", "experience"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
export type DoctorSearchParams = z.infer<typeof doctorSearchSchema>;

export const doctorAvailabilitySchema = z.object({
  days: z.coerce.number().int().positive().max(30).optional(),
});

export type DoctorAvailabilityParams = z.infer<typeof doctorAvailabilitySchema>;

