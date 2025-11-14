import { Schema, model, type Document, Types } from "mongoose";

export interface Dependent {
  name: string;
  relationship: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
}

export interface PatientNotificationPreferences {
  emailReminders: boolean;
  smsReminders: boolean;
  whatsappReminders: boolean;
  waitlistReminders: boolean;
}

export const defaultNotificationPreferences: PatientNotificationPreferences = {
  emailReminders: true,
  smsReminders: true,
  whatsappReminders: false,
  waitlistReminders: true,
};

export interface PatientDocument extends Document {
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
  medicalHistory?: string[];
  dependents: Dependent[];
  primaryClinicId?: Types.ObjectId | null;
  notificationPreferences: PatientNotificationPreferences;
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
    tenantId: { type: String, required: true, index: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, index: true },
    phone: { type: String, required: true, index: true },
    passwordHash: { type: String, required: true },
    dateOfBirth: Date,
    gender: { type: String, enum: ["male", "female", "other"] },
    medicalHistory: [{ type: String }],
    dependents: { type: [DependentSchema], default: [] },
    primaryClinicId: { type: Schema.Types.ObjectId, ref: "Clinic", default: null, index: true },
    notificationPreferences: {
      emailReminders: { type: Boolean, default: defaultNotificationPreferences.emailReminders },
      smsReminders: { type: Boolean, default: defaultNotificationPreferences.smsReminders },
      whatsappReminders: { type: Boolean, default: defaultNotificationPreferences.whatsappReminders },
      waitlistReminders: { type: Boolean, default: defaultNotificationPreferences.waitlistReminders },
    },
  },
  { timestamps: true }
);

PatientSchema.index({ tenantId: 1, email: 1 }, { unique: true });
PatientSchema.index({ tenantId: 1, phone: 1 }, { unique: true });

export const PatientModel = model<PatientDocument>("Patient", PatientSchema);

