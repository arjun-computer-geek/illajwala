import { Schema, model, type Document } from "mongoose";

export type ConsultationMode = "clinic" | "telehealth" | "home-visit";

export interface ClinicLocation {
  name: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

export interface DoctorDocument extends Document {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  about?: string;
  languages: string[];
  consultationModes: ConsultationMode[];
  fee: number;
  clinicLocations: ClinicLocation[];
  experienceYears?: number;
  rating?: number;
  totalReviews?: number;
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

const DoctorSchema = new Schema<DoctorDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true, unique: true },
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
    experienceYears: Number,
    rating: Number,
    totalReviews: Number,
  },
  { timestamps: true }
);

DoctorSchema.index({ specialization: 1 });
DoctorSchema.index({ name: "text", specialization: "text" });

export const DoctorModel = model<DoctorDocument>("Doctor", DoctorSchema);

