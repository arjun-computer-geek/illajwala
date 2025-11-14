import type { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  successResponse,
  paginateResponse,
  catchAsync,
  AppError,
  type AuthenticatedRequest,
} from '../../utils';
import { getServiceClients } from '../../config/service-clients';
import type { CreateClinicInput, ListClinicQuery, UpdateClinicInput } from './clinic.schema';
import type { Clinic } from '@illajwala/types';

export const handleCreateClinic = catchAsync<Record<string, never>, unknown, CreateClinicInput>(
  async (
    req: AuthenticatedRequest<Record<string, never>, unknown, CreateClinicInput>,
    res: Response,
  ) => {
    if (req.user?.role !== 'admin') {
      throw AppError.from({
        statusCode: StatusCodes.FORBIDDEN,
        message: 'Only admins can create clinics',
      });
    }

    const { provider } = getServiceClients(req);
    const clinic = await provider.createClinic(req.body as Partial<Clinic>);
    return res.status(StatusCodes.CREATED).json(successResponse(clinic, 'Clinic created'));
  },
);

export const handleListClinics = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const query = req.query as ListClinicQuery;
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const { provider } = getServiceClients(req);
  const params: { page?: number; limit?: number; search?: string } = { page, limit: pageSize };
  if (query.search) params.search = query.search;
  const result = await provider.listClinics(params);
  return res.json(paginateResponse(result.clinics, result.total, result.page, pageSize));
});

export const handleGetClinic = catchAsync<{ id: string }>(
  async (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
    const { provider } = getServiceClients(req);
    const clinic = await provider.getClinic(req.params.id);
    return res.json(successResponse(clinic));
  },
);

export const handleGetClinicBySlug = catchAsync<{ slug: string }>(
  async (req: AuthenticatedRequest<{ slug: string }>, res: Response) => {
    const { provider } = getServiceClients(req);
    const clinic = await provider.getClinicBySlug(req.params.slug);
    return res.json(successResponse(clinic));
  },
);

export const handleUpdateClinic = catchAsync<{ id: string }, unknown, UpdateClinicInput>(
  async (req: AuthenticatedRequest<{ id: string }, unknown, UpdateClinicInput>, res: Response) => {
    if (req.user?.role !== 'admin') {
      throw AppError.from({
        statusCode: StatusCodes.FORBIDDEN,
        message: 'Only admins can update clinics',
      });
    }

    const { provider } = getServiceClients(req);
    const clinic = await provider.updateClinic(req.params.id, req.body as Partial<Clinic>);
    return res.json(successResponse(clinic, 'Clinic updated'));
  },
);
