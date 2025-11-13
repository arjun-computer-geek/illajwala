import { Schema, model, type Document, Types } from "mongoose";
import type { ConsultationMode } from "../doctors/doctor.model";

export type AppointmentStatus = "pending-payment" | "confirmed" | "completed" | "cancelled";
export type AppointmentPaymentStatus = "pending" | "authorized" | "captured" | "failed";

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
  patient: Types.ObjectId;
  doctor: Types.ObjectId;
  scheduledAt: Date;
  mode: ConsultationMode;
  reasonForVisit?: string;
  status: AppointmentStatus;
  notes?: string;
  payment?: AppointmentPayment;
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
      enum: ["pending-payment", "confirmed", "completed", "cancelled"],
      default: "pending-payment",
    },
    notes: String,
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

AppointmentSchema.index({ doctor: 1, scheduledAt: 1 });
AppointmentSchema.index({ patient: 1, scheduledAt: -1 });
AppointmentSchema.index({ status: 1, scheduledAt: -1 });

export const AppointmentModel = model<AppointmentDocument>("Appointment", AppointmentSchema);

