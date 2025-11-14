import { Schema, model, type Document } from 'mongoose';

export interface ClinicCapacityRules {
  dailyAppointments?: number | null;
  simultaneousAppointments?: number | null;
  waitlistLimit?: number | null;
}

export interface ClinicWaitlistOverrides {
  maxQueueSize?: number | null;
  autoExpiryHours?: number | null;
  autoPromoteBufferMinutes?: number | null;
}

export interface ClinicDocument extends Document {
  tenantId: string;
  name: string;
  slug: string;
  timezone: string;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  capacity: ClinicCapacityRules;
  waitlistOverrides: ClinicWaitlistOverrides;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ClinicCapacitySchema = new Schema<ClinicCapacityRules>(
  {
    dailyAppointments: { type: Number, min: 0, default: null },
    simultaneousAppointments: { type: Number, min: 0, default: null },
    waitlistLimit: { type: Number, min: 0, default: null },
  },
  { _id: false },
);

const ClinicWaitlistOverridesSchema = new Schema<ClinicWaitlistOverrides>(
  {
    maxQueueSize: { type: Number, min: 0, default: null },
    autoExpiryHours: { type: Number, min: 0, default: null },
    autoPromoteBufferMinutes: { type: Number, min: 0, default: null },
  },
  { _id: false },
);

const ClinicSchema = new Schema<ClinicDocument>(
  {
    tenantId: { type: String, required: true, index: true, trim: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    timezone: { type: String, required: true, trim: true, default: 'Asia/Kolkata' },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    capacity: {
      type: ClinicCapacitySchema,
      default: () => ({}),
    },
    waitlistOverrides: {
      type: ClinicWaitlistOverridesSchema,
      default: () => ({}),
    },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

ClinicSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
ClinicSchema.index({ tenantId: 1, name: 1 });
ClinicSchema.index({ tenantId: 1, city: 1 });

export const ClinicModel = model<ClinicDocument>('Clinic', ClinicSchema);
