import { Schema, model, type Document } from "mongoose";

export type AdminDocument = Document & {
  name: string;
  email: string;
  passwordHash: string;
  role: "admin";
};

const adminSchema = new Schema<AdminDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, default: "admin" },
  },
  {
    timestamps: true,
  }
);

export const AdminModel = model<AdminDocument>("Admin", adminSchema);

