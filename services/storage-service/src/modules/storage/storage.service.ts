import { StatusCodes } from 'http-status-codes';
import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import { FileModel, type FileDocument, type FileCategory } from './storage.model';
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from '../../config/r2';
import { env, allowedFileTypes } from '../../config/env';
import { AppError, requireTenantId } from '../../utils';
import type { AuthenticatedRequest } from '../../utils';

const MAX_FILE_SIZE_BYTES = env.MAX_FILE_SIZE_MB * 1024 * 1024;

export interface UploadFileInput {
  category: FileCategory;
  description?: string;
  relatedEntityType?: 'appointment' | 'doctor' | 'clinic' | 'patient';
  relatedEntityId?: string;
}

export interface PresignedUrlInput {
  fileName: string;
  mimeType: string;
  category: FileCategory;
  expiresIn?: number;
  relatedEntityType?: 'appointment' | 'doctor' | 'clinic' | 'patient';
  relatedEntityId?: string;
}

const generateFileKey = (tenantId: string, category: FileCategory, fileName: string): string => {
  const timestamp = Date.now();
  const uuid = randomUUID();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const extension = fileName.split('.').pop() || '';
  return `${tenantId}/${category}/${timestamp}-${uuid}.${extension}`;
};

const validateFileType = (mimeType: string): void => {
  if (!allowedFileTypes.includes(mimeType)) {
    throw AppError.from({
      statusCode: StatusCodes.BAD_REQUEST,
      message: `File type ${mimeType} is not allowed. Allowed types: ${allowedFileTypes.join(', ')}`,
    });
  }
};

const validateFileSize = (sizeInBytes: number): void => {
  if (sizeInBytes > MAX_FILE_SIZE_BYTES) {
    throw AppError.from({
      statusCode: StatusCodes.BAD_REQUEST,
      message: `File size exceeds maximum allowed size of ${env.MAX_FILE_SIZE_MB}MB`,
    });
  }
};

export const generatePresignedUploadUrl = async (
  req: AuthenticatedRequest,
  input: PresignedUrlInput,
): Promise<{ uploadUrl: string; fileId: string; key: string }> => {
  const tenantId = requireTenantId(req);
  const userId = req.user!.id;

  validateFileType(input.mimeType);

  const key = generateFileKey(tenantId, input.category, input.fileName);
  const expiresIn = input.expiresIn || 300; // Default 5 minutes

  // Create file record with "uploading" status
  const fileRecordData: Record<string, unknown> = {
    tenantId,
    key,
    metadata: {
      originalName: input.fileName,
      mimeType: input.mimeType,
      sizeInBytes: 0, // Will be updated after upload
      category: input.category,
    },
    uploadedBy: new Types.ObjectId(userId),
    status: 'uploading',
  };

  // Link file to related entity if provided
  if (input.relatedEntityType && input.relatedEntityId) {
    fileRecordData.relatedEntityType = input.relatedEntityType;
    fileRecordData.relatedEntityId = new Types.ObjectId(input.relatedEntityId);
  }

  const fileRecord = new FileModel(fileRecordData);

  await fileRecord.save();

  // Generate presigned URL for upload
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: input.mimeType,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn });

  return {
    uploadUrl,
    fileId: String(fileRecord._id),
    key,
  };
};

export const confirmFileUpload = async (
  req: AuthenticatedRequest,
  fileId: string,
  sizeInBytes: number,
): Promise<FileDocument> => {
  const tenantId = requireTenantId(req);

  validateFileSize(sizeInBytes);

  const file = await FileModel.findOne({
    _id: fileId,
    tenantId,
    status: 'uploading',
  });

  if (!file) {
    throw AppError.from({
      statusCode: StatusCodes.NOT_FOUND,
      message: 'File not found or already confirmed',
    });
  }

  // Update file metadata and status
  file.metadata.sizeInBytes = sizeInBytes;
  file.status = 'uploaded';
  file.uploadedAt = new Date();

  // Generate public URL if configured
  if (R2_PUBLIC_URL) {
    file.url = `${R2_PUBLIC_URL}/${file.key}`;
  }

  await file.save();

  return file;
};

export const deleteFile = async (req: AuthenticatedRequest, fileId: string): Promise<void> => {
  const tenantId = requireTenantId(req);
  const userId = req.user!.id;

  const file = await FileModel.findOne({
    _id: fileId,
    tenantId,
    status: { $ne: 'deleted' },
  });

  if (!file) {
    throw AppError.from({
      statusCode: StatusCodes.NOT_FOUND,
      message: 'File not found',
    });
  }

  // Check permissions - user must be the uploader or an admin
  const isOwner = String(file.uploadedBy) === userId;
  const isAdmin = req.user!.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw AppError.from({
      statusCode: StatusCodes.FORBIDDEN,
      message: 'You do not have permission to delete this file',
    });
  }

  // Delete from R2
  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: file.key,
    });
    await r2Client.send(command);
  } catch (error) {
    // Log error but continue with database update
    console.error('Failed to delete file from R2:', error);
  }

  // Mark as deleted in database
  file.status = 'deleted';
  file.deletedAt = new Date();
  await file.save();
};

export const getFile = async (
  req: AuthenticatedRequest,
  fileId: string,
): Promise<{ file: FileDocument; downloadUrl?: string }> => {
  const tenantId = requireTenantId(req);

  const file = await FileModel.findOne({
    _id: fileId,
    tenantId,
    status: { $ne: 'deleted' },
  });

  if (!file) {
    throw AppError.from({
      statusCode: StatusCodes.NOT_FOUND,
      message: 'File not found',
    });
  }

  // Generate presigned download URL (valid for 1 hour)
  let downloadUrl: string | undefined;
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: file.key,
    });
    downloadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
  } catch (error) {
    console.error('Failed to generate download URL:', error);
  }

  return { file, downloadUrl };
};

export const listFiles = async (
  req: AuthenticatedRequest,
  filters: {
    category?: FileCategory;
    relatedEntityType?: 'appointment' | 'doctor' | 'clinic' | 'patient';
    relatedEntityId?: string;
    page: number;
    pageSize: number;
  },
): Promise<{ files: FileDocument[]; total: number }> => {
  const tenantId = requireTenantId(req);

  const query: Record<string, unknown> = {
    tenantId,
    status: { $ne: 'deleted' },
  };

  if (filters.category) {
    query['metadata.category'] = filters.category;
  }

  if (filters.relatedEntityType) {
    query.relatedEntityType = filters.relatedEntityType;
  }

  if (filters.relatedEntityId) {
    query.relatedEntityId = new Types.ObjectId(filters.relatedEntityId);
  }

  const skip = (filters.page - 1) * filters.pageSize;

  const [files, total] = await Promise.all([
    FileModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(filters.pageSize).lean(),
    FileModel.countDocuments(query),
  ]);

  return {
    files: files as unknown as FileDocument[],
    total,
  };
};
