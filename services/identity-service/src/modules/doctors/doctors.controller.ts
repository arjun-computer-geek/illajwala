import type { Request, Response, RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { successResponse, paginateResponse, catchAsync, AppError } from '../../utils';
import type {
  CreateDoctorInput,
  UpdateDoctorInput,
  DoctorSearchParams,
  DoctorAvailabilityParams,
  DoctorReviewActionInput,
  DoctorAddNoteInput,
  DoctorProfileUpdateInput,
} from './doctor.schema';
import { getServiceClients } from '../../config/service-clients';
import type { AuthenticatedRequest } from '../../utils';
import type { Doctor } from '@illajwala/types';

export const handleListSpecialties: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { provider } = getServiceClients(req);
    const specialties = await provider.listDoctorSpecialties();
    return res.json(successResponse(specialties));
  },
);

export const handleCreateDoctor = catchAsync<Record<string, never>, unknown, CreateDoctorInput>(
  async (
    req: AuthenticatedRequest<Record<string, never>, unknown, CreateDoctorInput>,
    res: Response,
  ) => {
    const { provider } = getServiceClients(req);
    const doctor = await provider.createDoctor(req.body as Partial<Doctor>);
    return res.status(StatusCodes.CREATED).json(successResponse(doctor, 'Doctor created'));
  },
);

export const handleUpdateDoctor = catchAsync<{ id: string }, unknown, UpdateDoctorInput>(
  async (req: AuthenticatedRequest<{ id: string }, unknown, UpdateDoctorInput>, res: Response) => {
    const { provider } = getServiceClients(req);
    const doctor = await provider.updateDoctor(req.params.id, req.body as Partial<Doctor>);
    return res.json(successResponse(doctor, 'Doctor updated'));
  },
);

export const handleGetDoctor = catchAsync<{ id: string }>(
  async (req: Request<{ id: string }>, res: Response) => {
    const { provider } = getServiceClients(req);
    const doctor = await provider.getDoctor(req.params.id);
    return res.json(successResponse(doctor));
  },
);

export const handleSearchDoctors = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const query = req.query as unknown as DoctorSearchParams;
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const { provider } = getServiceClients(req);
  const result = await provider.listDoctors({ ...query, page, pageSize });
  return res.json(paginateResponse(result.doctors, result.total, result.page, pageSize));
});

export const handleGetDoctorAvailability = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const params = req.query as unknown as DoctorAvailabilityParams;
    const { provider } = getServiceClients(req);
    const availabilityParams: { days?: number } = {};
    if (params.days) availabilityParams.days = params.days;
    const availability = await provider.getDoctorAvailability(id, availabilityParams);
    return res.json(successResponse(availability));
  },
);

export const handleReviewDoctor = catchAsync<{ id: string }, unknown, DoctorReviewActionInput>(
  async (
    req: AuthenticatedRequest<{ id: string }, unknown, DoctorReviewActionInput>,
    res: Response,
  ) => {
    const { provider } = getServiceClients(req);
    const reviewData: { status: string; note?: string } = { status: req.body.status };
    if (req.body.note) reviewData.note = req.body.note;
    const doctor = await provider.reviewDoctor(req.params.id, reviewData);
    return res.json(successResponse(doctor, 'Doctor review updated'));
  },
);

export const handleAddDoctorNote = catchAsync<{ id: string }, unknown, DoctorAddNoteInput>(
  async (req: AuthenticatedRequest<{ id: string }, unknown, DoctorAddNoteInput>, res: Response) => {
    const { provider } = getServiceClients(req);
    const noteData: { message: string; status?: string } = { message: req.body.message };
    if (req.body.status) noteData.status = req.body.status;
    const doctor = await provider.addDoctorNote(req.params.id, noteData);
    return res.status(StatusCodes.CREATED).json(successResponse(doctor, 'Review note added'));
  },
);

export const handleUpdateDoctorProfile = catchAsync<
  Record<string, never>,
  unknown,
  DoctorProfileUpdateInput
>(
  async (
    req: AuthenticatedRequest<Record<string, never>, unknown, DoctorProfileUpdateInput>,
    res: Response,
  ) => {
    if (!req.user || req.user.role !== 'doctor') {
      throw AppError.from({ statusCode: StatusCodes.FORBIDDEN, message: 'Forbidden' });
    }

    const { provider } = getServiceClients(req);
    const doctor = await provider.updateDoctorProfile(req.user.id, req.body as Partial<Doctor>);
    return res.json(successResponse(doctor, 'Profile updated'));
  },
);
