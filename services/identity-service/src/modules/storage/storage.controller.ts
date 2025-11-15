import type { Request, Response, RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { successResponse, catchAsync, AppError } from '../../utils';
import { getServiceClients } from '../../config/service-clients';
import type { AuthenticatedRequest } from '../../utils';

export const handleGeneratePresignedUrl: RequestHandler = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const { storage } = getServiceClients(req);
    const { fileName, mimeType, category, expiresIn, relatedEntityType, relatedEntityId } =
      req.body as {
        fileName: string;
        mimeType: string;
        category: string;
        expiresIn?: number;
        relatedEntityType?: 'appointment' | 'doctor' | 'clinic' | 'patient';
        relatedEntityId?: string;
      };

    if (!fileName || !mimeType || !category) {
      throw AppError.from({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'fileName, mimeType, and category are required',
      });
    }

    const params: {
      fileName: string;
      mimeType: string;
      category: string;
      expiresIn?: number;
      relatedEntityType?: 'appointment' | 'doctor' | 'clinic' | 'patient';
      relatedEntityId?: string;
    } = { fileName, mimeType, category };
    if (expiresIn) params.expiresIn = expiresIn;
    if (relatedEntityType) params.relatedEntityType = relatedEntityType;
    if (relatedEntityId) params.relatedEntityId = relatedEntityId;

    const result = await storage.generatePresignedUrl(params);

    return res.json(successResponse(result, 'Presigned URL generated'));
  },
);

export const handleConfirmUpload: RequestHandler = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const { storage } = getServiceClients(req);
    const { fileId } = req.params;
    const { sizeInBytes } = req.body as { sizeInBytes: number };

    if (!fileId || !sizeInBytes || sizeInBytes <= 0) {
      throw AppError.from({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'fileId and sizeInBytes are required',
      });
    }

    const file = await storage.confirmFileUpload(fileId, sizeInBytes);
    return res.json(successResponse(file, 'File upload confirmed'));
  },
);

export const handleGetFile: RequestHandler = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const { storage } = getServiceClients(req);
    const { fileId } = req.params;

    if (!fileId) {
      throw AppError.from({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'fileId is required',
      });
    }

    const result = await storage.getFile(fileId);
    return res.json(successResponse(result, 'File retrieved'));
  },
);

export const handleListFiles: RequestHandler = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const { storage } = getServiceClients(req);
    const query = req.query as {
      category?: string;
      relatedEntityType?: string;
      relatedEntityId?: string;
      page?: string;
      pageSize?: string;
    };

    const params: {
      category?: string;
      relatedEntityType?: 'appointment' | 'doctor' | 'clinic' | 'patient';
      relatedEntityId?: string;
      page?: number;
      pageSize?: number;
    } = {};

    if (query.category) params.category = query.category;
    if (query.relatedEntityType)
      params.relatedEntityType = query.relatedEntityType as
        | 'appointment'
        | 'doctor'
        | 'clinic'
        | 'patient';
    if (query.relatedEntityId) params.relatedEntityId = query.relatedEntityId;
    if (query.page) params.page = Number(query.page);
    if (query.pageSize) params.pageSize = Number(query.pageSize);

    const result = await storage.listFiles(params);
    return res.json({
      ...successResponse(result.files, 'Files retrieved'),
      meta: {
        total: result.total,
        page: result.page,
        pageSize: result.totalPages * (params.pageSize || 20),
        totalPages: result.totalPages,
      },
    });
  },
);

export const handleDeleteFile: RequestHandler = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const { storage } = getServiceClients(req);
    const { fileId } = req.params;

    if (!fileId) {
      throw AppError.from({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'fileId is required',
      });
    }

    await storage.deleteFile(fileId);
    return res.json(successResponse(null, 'File deleted successfully'));
  },
);
