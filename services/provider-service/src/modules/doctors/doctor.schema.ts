import { z } from 'zod';
import { doctorReviewStatusSchema, doctorOnboardingChecklistSchema } from '@illajwala/types';

const consultationModeSchema = z.enum(['clinic', 'telehealth', 'home-visit']);

const clinicLocationInputSchema = z.object({
  name: z.string(),
  address: z.string(),
  city: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const reviewNoteInputSchema = z.object({
  message: z.string().min(1),
  author: z.string().optional(),
  status: doctorReviewStatusSchema.optional(),
});

const onboardingChecklistInputSchema = doctorOnboardingChecklistSchema.partial();

export const createDoctorSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(8),
  specialization: z.string().min(1),
  about: z.string().max(2000).optional(),
  languages: z.array(z.string()).default([]),
  consultationModes: z.array(consultationModeSchema).default(['clinic']),
  fee: z.number().nonnegative().default(0),
  experienceYears: z.number().int().nonnegative().optional(),
  clinicLocations: z.array(clinicLocationInputSchema).default([]),
  primaryClinicId: z.string().optional(),
  clinicIds: z.array(z.string()).optional(),
  reviewStatus: doctorReviewStatusSchema.optional(),
  reviewNotes: z.array(reviewNoteInputSchema).optional(),
  onboardingChecklist: onboardingChecklistInputSchema.optional(),
});

export const adminUpdateDoctorSchema = createDoctorSchema.partial();

export const doctorProfileUpdateSchema = z
  .object({
    name: z.string().min(1).optional(),
    about: z.string().max(2000).optional(),
    languages: z.array(z.string()).optional(),
    consultationModes: z.array(consultationModeSchema).optional(),
    fee: z.number().nonnegative().optional(),
    experienceYears: z.number().int().nonnegative().optional(),
    clinicLocations: z.array(clinicLocationInputSchema).optional(),
    primaryClinicId: z.string().optional(),
    clinicIds: z.array(z.string()).optional(),
    profileImageUrl: z.string().url().optional(),
    onboardingChecklist: onboardingChecklistInputSchema.optional(),
  })
  .strict();

export const doctorSearchSchema = z.object({
  query: z.string().optional(),
  specialization: z.string().optional(),
  city: z.string().optional(),
  consultationMode: consultationModeSchema.optional(),
  featured: z.coerce.boolean().optional(),
  sort: z.enum(['rating', 'fee', 'experience']).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof adminUpdateDoctorSchema>;
export type DoctorProfileUpdateInput = z.infer<typeof doctorProfileUpdateSchema>;
export type DoctorSearchParams = z.infer<typeof doctorSearchSchema>;

export const doctorAvailabilitySchema = z.object({
  days: z.coerce.number().int().positive().max(30).optional(),
});

export type DoctorAvailabilityParams = z.infer<typeof doctorAvailabilitySchema>;

export const doctorReviewActionSchema = z.object({
  status: doctorReviewStatusSchema,
  note: z.string().min(1).optional(),
  author: z.string().optional(),
  onboardingChecklist: onboardingChecklistInputSchema.optional(),
});

export type DoctorReviewActionInput = z.infer<typeof doctorReviewActionSchema>;

export const doctorAddNoteSchema = reviewNoteInputSchema.extend({
  status: doctorReviewStatusSchema.optional(),
});

export type DoctorAddNoteInput = z.infer<typeof doctorAddNoteSchema>;
