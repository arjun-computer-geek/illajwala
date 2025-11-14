import { Schema, model, type Document, Types } from 'mongoose';

export type FileCategory =
  | 'patient-document'
  | 'doctor-profile'
  | 'clinic-image'
  | 'consultation-attachment'
  | 'prescription'
  | 'other';

export type FileStatus = 'uploading' | 'uploaded' | 'failed' | 'deleted';

export interface FileMetadata {
  originalName: string;
  mimeType: string;
  sizeInBytes: number;
  category: FileCategory;
  description?: string;
}

export interface FileDocument extends Document {
  tenantId: string;
  key: string; // R2 object key
  url?: string; // Public URL if available
  metadata: FileMetadata;
  uploadedBy: Types.ObjectId; // User ID
  relatedEntityType?: 'appointment' | 'doctor' | 'clinic' | 'patient' | null;
  relatedEntityId?: Types.ObjectId | null;
  status: FileStatus;
  uploadedAt: Date;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const FileMetadataSchema = new Schema<FileMetadata>(
  {
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeInBytes: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      enum: [
        'patient-document',
        'doctor-profile',
        'clinic-image',
        'consultation-attachment',
        'prescription',
        'other',
      ],
      required: true,
    },
    description: String,
  },
  { _id: false },
);

const FileSchema = new Schema<FileDocument>(
  {
    tenantId: { type: String, required: true, index: true, trim: true },
    key: { type: String, required: true, unique: true, index: true },
    url: String,
    metadata: { type: FileMetadataSchema, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    relatedEntityType: {
      type: String,
      enum: ['appointment', 'doctor', 'clinic', 'patient', null],
      default: null,
    },
    relatedEntityId: { type: Schema.Types.ObjectId, index: true },
    status: {
      type: String,
      enum: ['uploading', 'uploaded', 'failed', 'deleted'],
      default: 'uploading',
    },
    uploadedAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

FileSchema.index({ tenantId: 1, category: 1 });
FileSchema.index({ tenantId: 1, uploadedBy: 1 });
FileSchema.index({ tenantId: 1, relatedEntityType: 1, relatedEntityId: 1 });
FileSchema.index({ tenantId: 1, status: 1 });

export const FileModel = model<FileDocument>('File', FileSchema);
