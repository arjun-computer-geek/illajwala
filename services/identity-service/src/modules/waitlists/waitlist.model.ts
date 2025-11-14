import { Schema, model, type Document, type Types } from "mongoose";

export type WaitlistStatus = "active" | "invited" | "promoted" | "expired" | "cancelled";

export interface WaitlistAuditEntry {
  action: "created" | "updated" | "status-change" | "promotion" | "expiration" | "cancellation";
  actorId?: Types.ObjectId | null;
  notes?: string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export interface WaitlistRequestedWindow {
  start?: Date;
  end?: Date;
  notes?: string;
}

export interface WaitlistEntryDocument extends Document {
  tenantId: string;
  clinicId?: Types.ObjectId | null;
  doctorId?: Types.ObjectId | null;
  patientId: Types.ObjectId;
  status: WaitlistStatus;
  priorityScore: number;
  requestedWindow?: WaitlistRequestedWindow;
  notes?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
  promotedAppointmentId?: Types.ObjectId | null;
  audit: WaitlistAuditEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const WaitlistAuditSchema = new Schema<WaitlistAuditEntry>(
  {
    action: {
      type: String,
      enum: ["created", "updated", "status-change", "promotion", "expiration", "cancellation"],
      required: true,
    },
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    notes: { type: String },
    createdAt: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const RequestedWindowSchema = new Schema<WaitlistRequestedWindow>(
  {
    start: { type: Date },
    end: { type: Date },
    notes: { type: String, maxlength: 500 },
  },
  { _id: false }
);

const WaitlistEntrySchema = new Schema<WaitlistEntryDocument>(
  {
    tenantId: { type: String, required: true, index: true, trim: true },
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic" },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor" },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    status: {
      type: String,
      enum: ["active", "invited", "promoted", "expired", "cancelled"],
      default: "active",
      index: true,
    },
    priorityScore: { type: Number, required: true, index: true },
    requestedWindow: { type: RequestedWindowSchema, default: undefined },
    notes: { type: String },
    metadata: { type: Schema.Types.Mixed },
    expiresAt: { type: Date, index: true },
    promotedAppointmentId: { type: Schema.Types.ObjectId, ref: "Appointment" },
    audit: { type: [WaitlistAuditSchema], default: [] },
  },
  { timestamps: true }
);

WaitlistEntrySchema.index(
  { tenantId: 1, clinicId: 1, status: 1, priorityScore: 1, createdAt: 1 },
  { name: "waitlist_queue_lookup" }
);
WaitlistEntrySchema.index(
  { tenantId: 1, patientId: 1, status: 1 },
  { name: "waitlist_patient_status" }
);
WaitlistEntrySchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: { expiresAt: { $type: "date" } },
    name: "waitlist_expiry_ttl",
  }
);

export const WaitlistModel = model<WaitlistEntryDocument>("WaitlistEntry", WaitlistEntrySchema);

export interface WaitlistPolicyDocument extends Document {
  tenantId: string;
  clinicId?: Types.ObjectId | null;
  maxQueueSize: number;
  autoExpiryHours: number;
  autoPromoteBufferMinutes: number;
  priorityWeights?: Record<string, number>;
  notificationTemplateOverrides?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const WaitlistPolicySchema = new Schema<WaitlistPolicyDocument>(
  {
    tenantId: { type: String, required: true, index: true, trim: true },
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", default: null },
    maxQueueSize: { type: Number, default: 250 },
    autoExpiryHours: { type: Number, default: 72 },
    autoPromoteBufferMinutes: { type: Number, default: 30 },
    priorityWeights: { type: Schema.Types.Mixed, default: {} },
    notificationTemplateOverrides: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

WaitlistPolicySchema.index(
  { tenantId: 1, clinicId: 1 },
  { unique: true, name: "waitlist_policy_unique" }
);

export const WaitlistPolicyModel = model<WaitlistPolicyDocument>(
  "WaitlistPolicy",
  WaitlistPolicySchema
);

