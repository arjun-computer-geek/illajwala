import type { Request, Response, RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { successResponse, paginateResponse } from "../../utils/api-response";
import { catchAsync } from "../../utils/catch-async";
import { AppError } from "../../utils/app-error";
import type {
  CreateDoctorInput,
  UpdateDoctorInput,
  DoctorSearchParams,
  DoctorAvailabilityParams,
  DoctorReviewActionInput,
  DoctorAddNoteInput,
  DoctorProfileUpdateInput,
} from "./doctor.schema";
import {
  createDoctor,
  getDoctorById,
  listDoctorSpecialties,
  searchDoctors,
  updateDoctor,
  getDoctorAvailability,
  reviewDoctor,
  addDoctorReviewNote,
  updateDoctorProfile,
} from "./doctor.service";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { requireTenantId } from "../../utils/tenant";

export const handleListSpecialties: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const tenantId = requireTenantId(req);
  const specialties = await listDoctorSpecialties(tenantId);
  return res.json(successResponse(specialties));
});

export const handleCreateDoctor = catchAsync<
  Record<string, never>,
  unknown,
  CreateDoctorInput
>(async (req: AuthenticatedRequest<Record<string, never>, unknown, CreateDoctorInput>, res: Response) => {
  if (!req.user?.tenantId) {
    throw AppError.from({ statusCode: StatusCodes.FORBIDDEN, message: "Tenant context missing" });
  }

  const doctor = await createDoctor(req.body, req.user.tenantId);
  return res.status(StatusCodes.CREATED).json(successResponse(doctor, "Doctor created"));
});

export const handleUpdateDoctor = catchAsync<
  { id: string },
  unknown,
  UpdateDoctorInput
>(async (req: AuthenticatedRequest<{ id: string }, unknown, UpdateDoctorInput>, res: Response) => {
  if (!req.user?.tenantId) {
    throw AppError.from({ statusCode: StatusCodes.FORBIDDEN, message: "Tenant context missing" });
  }

  const doctor = await updateDoctor(req.params.id, req.user.tenantId, req.body);

  if (!doctor) {
    throw AppError.from({ statusCode: StatusCodes.NOT_FOUND, message: "Doctor not found" });
  }

  return res.json(successResponse(doctor, "Doctor updated"));
});

export const handleGetDoctor = catchAsync<{ id: string }>(
  async (req: Request<{ id: string }>, res: Response) => {
    const tenantId = requireTenantId(req);
    const doctor = await getDoctorById(req.params.id, tenantId);

    if (!doctor) {
      throw AppError.from({ statusCode: StatusCodes.NOT_FOUND, message: "Doctor not found" });
    }

    return res.json(successResponse(doctor));
  }
);

export const handleSearchDoctors = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = requireTenantId(req);
  const query = req.query as unknown as DoctorSearchParams;
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;

  const { items, total } = await searchDoctors(
    {
      ...query,
      page,
      pageSize,
    },
    tenantId
  );

  return res.json(paginateResponse(items, total, page, pageSize));
});

export const handleGetDoctorAvailability = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = requireTenantId(req);
  const { id } = req.params as { id: string };
  const params = req.query as unknown as DoctorAvailabilityParams;
  const availability = await getDoctorAvailability(id, tenantId, params);

  if (!availability) {
    throw AppError.from({ statusCode: StatusCodes.NOT_FOUND, message: "Doctor not found" });
  }

  return res.json(successResponse(availability));
});

export const handleReviewDoctor = catchAsync<
  { id: string },
  unknown,
  DoctorReviewActionInput
>(async (req: AuthenticatedRequest<{ id: string }, unknown, DoctorReviewActionInput>, res: Response) => {
  if (!req.user?.tenantId) {
    throw AppError.from({ statusCode: StatusCodes.FORBIDDEN, message: "Tenant context missing" });
  }

  const doctor = await reviewDoctor(req.params.id, req.user.tenantId, req.body);
  return res.json(successResponse(doctor, "Doctor review updated"));
});

export const handleAddDoctorNote = catchAsync<
  { id: string },
  unknown,
  DoctorAddNoteInput
>(async (req: AuthenticatedRequest<{ id: string }, unknown, DoctorAddNoteInput>, res: Response) => {
  if (!req.user?.tenantId) {
    throw AppError.from({ statusCode: StatusCodes.FORBIDDEN, message: "Tenant context missing" });
  }

  const doctor = await addDoctorReviewNote(req.params.id, req.user.tenantId, req.body);
  return res.status(StatusCodes.CREATED).json(successResponse(doctor, "Review note added"));
});

export const handleUpdateDoctorProfile = catchAsync<
  Record<string, never>,
  unknown,
  DoctorProfileUpdateInput
>(
  async (
    req: AuthenticatedRequest<Record<string, never>, unknown, DoctorProfileUpdateInput>,
    res: Response
  ) => {
    if (!req.user || req.user.role !== "doctor") {
      throw AppError.from({ statusCode: StatusCodes.FORBIDDEN, message: "Forbidden" });
    }

    if (!req.user.tenantId) {
      throw AppError.from({ statusCode: StatusCodes.FORBIDDEN, message: "Tenant context missing" });
    }

    const doctor = await updateDoctorProfile(req.user.id, req.user.tenantId, req.body);
    return res.json(successResponse(doctor, "Profile updated"));
  }
);
