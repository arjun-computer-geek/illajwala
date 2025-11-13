import { Schema, model, type Document, Types } from "mongoose";
import type { ConsultationMode } from "../doctors/doctor.model";

// NOTE: Sprint 3 introduces consultation lifecycle states that extend beyond the
// earlier booking-only workflow. These additional states are essential for the
// doctor workspace as well as patient reminders.
export type AppointmentStatus =
  | "pending-payment"
  | "confirmed"
  | "checked-in"
  | "in-session"
  | "completed"
  | "cancelled"
  | "no-show";
export type AppointmentPaymentStatus = "pending" | "authorized" | "captured" | "failed";

// Attachments, vitals, and consultation metadata are stored as sub-documents on
// the appointment record for now. Future sprints may extract these into a
// dedicated service, but this keeps the API surface tight while we iterate.
export interface AppointmentConsultationAttachment {
  key: string;
  name: string;
  url?: string;
  contentType?: string;
  sizeInBytes?: number;
}

export interface AppointmentConsultationVitalsEntry {
  label: string;
  value: string;
  unit?: string;
}

// All visit-related information lives under `consultation`. We track optional
// metadata only when the visit progresses beyond confirmation.
export interface AppointmentConsultation {
  startedAt?: Date;
  endedAt?: Date;
  notes?: string;
  followUpActions?: string[];
  attachments?: AppointmentConsultationAttachment[];
  vitals?: AppointmentConsultationVitalsEntry[];
  lastEditedBy?: Types.ObjectId;
}

export interface AppointmentPaymentEvent {
  type: "order-created" | "payment-authorized" | "payment-captured" | "payment-failed" | "webhook-received" | "manual-update";
  payload?: Record<string, unknown>;
  createdAt: Date;
}

export interface AppointmentPayment {
  orderId: string;
  status: AppointmentPaymentStatus;
  amount: number;
  currency: string;
  receipt?: string;
  paymentId?: string;
  signature?: string;
  history: AppointmentPaymentEvent[];
  intentExpiresAt?: Date;
  capturedAt?: Date;
  failedAt?: Date;
}

export interface AppointmentDocument extends Document {
  tenantId: string;
  patient: Types.ObjectId;
  doctor: Types.ObjectId;
  scheduledAt: Date;
  mode: ConsultationMode;
  reasonForVisit?: string;
  status: AppointmentStatus;
  notes?: string;
  consultation?: AppointmentConsultation;
  payment?: AppointmentPayment;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<AppointmentDocument>(
  {
    tenantId: { type: String, required: true, index: true, trim: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    scheduledAt: { type: Date, required: true },
    mode: { type: String, enum: ["clinic", "telehealth", "home-visit"], required: true },
    reasonForVisit: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending-payment", "confirmed", "checked-in", "in-session", "completed", "cancelled", "no-show"],
      default: "pending-payment",
    },
    notes: String,
    // Consultation sub-document groups visit lifecycle metadata and keeps the
    // parent document lean for simple bookings.
    consultation: {
      startedAt: { type: Date },
      endedAt: { type: Date },
      notes: { type: String },
      followUpActions: [String],
      attachments: [
        {
          key: { type: String, required: true },
          name: { type: String, required: true },
          url: { type: String },
          contentType: { type: String },
          sizeInBytes: { type: Number },
        },
      ],
      vitals: [
        {
          label: { type: String, required: true },
          value: { type: String, required: true },
          unit: { type: String },
        },
      ],
      lastEditedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    payment: {
      orderId: { type: String },
      status: {
        type: String,
        enum: ["pending", "authorized", "captured", "failed"],
        default: "pending",
      },
      amount: { type: Number },
      currency: { type: String, default: "INR" },
      receipt: { type: String },
      paymentId: { type: String },
      signature: { type: String },
      intentExpiresAt: { type: Date },
      capturedAt: { type: Date },
      failedAt: { type: Date },
      history: [
        {
          type: {
            type: String,
            enum: [
              "order-created",
              "payment-authorized",
              "payment-captured",
              "payment-failed",
              "webhook-received",
              "manual-update",
            ],
          },
          payload: { type: Schema.Types.Mixed },
          createdAt: { type: Date, default: Date.now },
        },
      ],
    },
  },
  { timestamps: true }
);

AppointmentSchema.index({ tenantId: 1, doctor: 1, scheduledAt: 1 });
AppointmentSchema.index({ tenantId: 1, patient: 1, scheduledAt: -1 });
AppointmentSchema.index({ tenantId: 1, status: 1, scheduledAt: -1 });

export const AppointmentModel = model<AppointmentDocument>("Appointment", AppointmentSchema);

