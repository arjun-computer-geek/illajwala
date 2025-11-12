import { Schema, model, type Document } from "mongoose";

export interface Dependent {
  name: string;
  relationship: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
}

export interface PatientDocument extends Document {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
  medicalHistory?: string[];
  dependents: Dependent[];
  createdAt: Date;
  updatedAt: Date;
}

const DependentSchema = new Schema<Dependent>(
  {
    name: { type: String, required: true, trim: true },
    relationship: { type: String, required: true },
    dateOfBirth: Date,
    gender: { type: String, enum: ["male", "female", "other"] },
  },
  { _id: false }
);

const PatientSchema = new Schema<PatientDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    dateOfBirth: Date,
    gender: { type: String, enum: ["male", "female", "other"] },
    medicalHistory: [{ type: String }],
    dependents: { type: [DependentSchema], default: [] },
  },
  { timestamps: true }
);

PatientSchema.index({ email: 1 });
PatientSchema.index({ phone: 1 });

export const PatientModel = model<PatientDocument>("Patient", PatientSchema);

