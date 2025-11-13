import { z } from "zod";
import {
  clinicLocationSchema,
  consultationModeSchema,
  objectIdSchema,
  ratingSchema,
} from "./common";

export const doctorReviewStatusSchema = z.enum(["pending", "needs-info", "approved", "active"]);

export const doctorReviewNoteSchema = z.object({
  _id: objectIdSchema.optional(),
  message: z.string(),
  author: z.string().optional(),
  status: doctorReviewStatusSchema.optional(),
  createdAt: z.string(),
});

export const doctorOnboardingChecklistSchema = z.object({
  kycComplete: z.boolean().default(false),
  payoutSetupComplete: z.boolean().default(false),
  telehealthReady: z.boolean().default(false),
});

export const doctorSchema = z.object({
  _id: objectIdSchema,
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  specialization: z.string(),
  about: z.string().optional(),
  languages: z.array(z.string()).default([]),
  consultationModes: z.array(consultationModeSchema).default(["clinic"]),
  fee: z.number().nonnegative().optional(),
  rating: ratingSchema,
  totalReviews: z.number().int().nonnegative().optional(),
  clinicLocations: z.array(clinicLocationSchema).default([]),
  experienceYears: z.number().int().nonnegative().optional(),
  profileImageUrl: z.string().url().optional(),
  highlighted: z.boolean().optional(),
  reviewStatus: doctorReviewStatusSchema.default("pending"),
  reviewNotes: z.array(doctorReviewNoteSchema).default([]),
  onboardingChecklist: doctorOnboardingChecklistSchema.default({}),
  lastReviewedAt: z.string().nullable().optional(),
  approvedAt: z.string().nullable().optional(),
});

export const doctorSearchSchema = z.object({
  query: z.string().optional(),
  specialization: z.string().optional(),
  city: z.string().optional(),
  consultationMode: consultationModeSchema.optional(),
  featured: z.coerce.boolean().optional(),
  sort: z.enum(["rating", "fee", "experience"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export type Doctor = z.infer<typeof doctorSchema>;
export type DoctorSearchParams = z.infer<typeof doctorSearchSchema>;
export type DoctorReviewStatus = z.infer<typeof doctorReviewStatusSchema>;

