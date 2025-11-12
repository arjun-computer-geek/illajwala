import { Schema, model, type Document, Types } from "mongoose";
import type { ConsultationMode } from "../doctors/doctor.model";

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface AppointmentDocument extends Document {
  patient: Types.ObjectId;
  doctor: Types.ObjectId;
  scheduledAt: Date;
  mode: ConsultationMode;
  reasonForVisit?: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<AppointmentDocument>(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    scheduledAt: { type: Date, required: true },
    mode: { type: String, enum: ["clinic", "telehealth", "home-visit"], required: true },
    reasonForVisit: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    notes: String,
  },
  { timestamps: true }
);

AppointmentSchema.index({ doctor: 1, scheduledAt: 1 });
AppointmentSchema.index({ patient: 1, scheduledAt: -1 });

export const AppointmentModel = model<AppointmentDocument>("Appointment", AppointmentSchema);

