import { z } from 'zod';

export const uploadFileSchema = z.object({
  category: z.enum([
    'patient-document',
    'doctor-profile',
    'clinic-image',
    'consultation-attachment',
    'prescription',
    'other',
  ]),
  description: z.string().optional(),
  relatedEntityType: z.enum(['appointment', 'doctor', 'clinic', 'patient']).optional(),
  relatedEntityId: z.string().optional(),
});

export const deleteFileSchema = z.object({
  fileId: z.string().min(1),
});

export const getPresignedUrlSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  category: z.enum([
    'patient-document',
    'doctor-profile',
    'clinic-image',
    'consultation-attachment',
    'prescription',
    'other',
  ]),
  expiresIn: z.coerce.number().int().positive().max(3600).default(300), // Max 1 hour, default 5 minutes
});

export const listFilesSchema = z.object({
  category: z
    .enum([
      'patient-document',
      'doctor-profile',
      'clinic-image',
      'consultation-attachment',
      'prescription',
      'other',
    ])
    .optional(),
  relatedEntityType: z.enum(['appointment', 'doctor', 'clinic', 'patient']).optional(),
  relatedEntityId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
