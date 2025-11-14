import { Schema, model, type Document, Types } from "mongoose";

export type ConsultationMode = "clinic" | "telehealth" | "home-visit";
export type DoctorReviewStatus = "pending" | "needs-info" | "approved" | "active";

export interface ClinicLocation {
  name: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

export interface DoctorReviewNote {
  message: string;
  author?: string;
  status?: DoctorReviewStatus;
  createdAt: Date;
}

export interface OnboardingChecklist {
  kycComplete: boolean;
  payoutSetupComplete: boolean;
  telehealthReady: boolean;
}

export interface DoctorDocument extends Document {
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  about?: string;
  languages: string[];
  consultationModes: ConsultationMode[];
  fee: number;
  clinicLocations: ClinicLocation[];
  primaryClinicId?: Types.ObjectId | null;
  clinicIds: Types.ObjectId[];
  experienceYears?: number;
  rating?: number;
  totalReviews?: number;
  reviewStatus: DoctorReviewStatus;
  reviewNotes: DoctorReviewNote[];
  onboardingChecklist: OnboardingChecklist;
  lastReviewedAt?: Date | null;
  approvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ClinicLocationSchema = new Schema<ClinicLocation>(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    latitude: Number,
    longitude: Number,
  },
  { _id: false }
);

const ReviewNoteSchema = new Schema<DoctorReviewNote>(
  {
    message: { type: String, required: true, trim: true },
    author: { type: String },
    status: { type: String, enum: ["pending", "needs-info", "approved", "active"] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const OnboardingChecklistSchema = new Schema<OnboardingChecklist>(
  {
    kycComplete: { type: Boolean, default: false },
    payoutSetupComplete: { type: Boolean, default: false },
    telehealthReady: { type: Boolean, default: false },
  },
  { _id: false }
);

const DoctorSchema = new Schema<DoctorDocument>(
  {
    tenantId: { type: String, required: true, index: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, index: true },
    phone: { type: String, required: true, index: true },
    specialization: { type: String, required: true },
    about: String,
    languages: { type: [String], default: [] },
    consultationModes: {
      type: [String],
      enum: ["clinic", "telehealth", "home-visit"],
      default: ["clinic"],
    },
    fee: { type: Number, default: 0 },
    clinicLocations: { type: [ClinicLocationSchema], default: [] },
    primaryClinicId: { type: Schema.Types.ObjectId, ref: "Clinic", default: null },
    clinicIds: { type: [Schema.Types.ObjectId], ref: "Clinic", default: [] },
    experienceYears: Number,
    rating: Number,
    totalReviews: Number,
    reviewStatus: {
      type: String,
      enum: ["pending", "needs-info", "approved", "active"],
      default: "pending",
    },
    reviewNotes: { type: [ReviewNoteSchema], default: [] },
    onboardingChecklist: { type: OnboardingChecklistSchema, default: () => ({}) },
    lastReviewedAt: Date,
    approvedAt: Date,
  },
  { timestamps: true }
);

DoctorSchema.index({ tenantId: 1 });
DoctorSchema.index({ tenantId: 1, specialization: 1 });
DoctorSchema.index({ name: "text", specialization: "text" });
DoctorSchema.index({ tenantId: 1, reviewStatus: 1 });
DoctorSchema.index({ tenantId: 1, primaryClinicId: 1 });
DoctorSchema.index({ tenantId: 1, email: 1 }, { unique: true });
DoctorSchema.index({ tenantId: 1, phone: 1 }, { unique: true });

export const DoctorModel = model<DoctorDocument>("Doctor", DoctorSchema);

