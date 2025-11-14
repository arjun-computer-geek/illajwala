import type { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  successResponse,
  catchAsync,
  AppError,
  requireTenantId,
  type AuthenticatedRequest,
} from '../../utils';
import {
  generatePresignedUploadUrl,
  confirmFileUpload,
  deleteFile,
  getFile,
  listFiles,
} from './storage.service';
import type { UploadFileInput, PresignedUrlInput } from './storage.service';

export const handleGeneratePresignedUrl = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const input = req.body as PresignedUrlInput;
    const result = await generatePresignedUploadUrl(req, input);
    return res.json(successResponse(result, 'Presigned URL generated'));
  },
);

export const handleConfirmUpload = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { fileId } = req.params;
  const { sizeInBytes } = req.body as { sizeInBytes: number };

  if (!sizeInBytes || sizeInBytes <= 0) {
    throw AppError.from({
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'sizeInBytes is required and must be greater than 0',
    });
  }

  const file = await confirmFileUpload(req, fileId, sizeInBytes);
  return res.json(successResponse(file, 'File upload confirmed'));
});

export const handleDeleteFile = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { fileId } = req.params;
  await deleteFile(req, fileId);
  return res.json(successResponse(null, 'File deleted successfully'));
});

export const handleGetFile = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { fileId } = req.params;
  const result = await getFile(req, fileId);
  return res.json(successResponse(result, 'File retrieved'));
});

export const handleListFiles = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = requireTenantId(req);
  const query = req.query as {
    category?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    page?: string;
    pageSize?: string;
  };

  const filters = {
    category: query.category as any,
    relatedEntityType: query.relatedEntityType as any,
    relatedEntityId: query.relatedEntityId,
    page: Number(query.page) || 1,
    pageSize: Number(query.pageSize) || 20,
  };

  const result = await listFiles(req, filters);
  return res.json({
    ...successResponse(result.files, 'Files retrieved'),
    meta: {
      total: result.total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(result.total / filters.pageSize),
    },
  });
});
