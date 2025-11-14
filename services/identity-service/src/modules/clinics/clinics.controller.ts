import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { successResponse, paginateResponse } from "../../utils/api-response";
import { catchAsync } from "../../utils/catch-async";
import { AppError } from "../../utils/app-error";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { requireTenantId } from "../../utils/tenant";
import {
  createClinic,
  listClinics,
  getClinicById,
  updateClinic,
  getClinicBySlug,
} from "./clinic.service";
import type { CreateClinicInput, ListClinicQuery, UpdateClinicInput } from "./clinic.schema";

export const handleCreateClinic = catchAsync<
  Record<string, never>,
  unknown,
  CreateClinicInput
>(async (req: AuthenticatedRequest<Record<string, never>, unknown, CreateClinicInput>, res: Response) => {
  const tenantId = requireTenantId(req);
  if (req.user?.role !== "admin") {
    throw AppError.from({ statusCode: StatusCodes.FORBIDDEN, message: "Only admins can create clinics" });
  }

  const clinic = await createClinic(tenantId, req.body);
  return res.status(StatusCodes.CREATED).json(successResponse(clinic.toObject?.() ?? clinic, "Clinic created"));
});

export const handleListClinics = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = requireTenantId(req);
  const query = req.query as ListClinicQuery;

  const { items, total } = await listClinics(tenantId, query);
  return res.json(paginateResponse(items.map((item) => item.toObject?.() ?? item), total, query.page ?? 1, query.pageSize ?? 20));
});

export const handleGetClinic = catchAsync<{ id: string }>(async (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  const tenantId = requireTenantId(req);
  const clinic = await getClinicById(tenantId, req.params.id);

  if (!clinic) {
    throw AppError.from({ statusCode: StatusCodes.NOT_FOUND, message: "Clinic not found" });
  }

  return res.json(successResponse(clinic.toObject?.() ?? clinic));
});

export const handleGetClinicBySlug = catchAsync<{ slug: string }>(
  async (req: AuthenticatedRequest<{ slug: string }>, res: Response) => {
    const tenantId = requireTenantId(req);
    const clinic = await getClinicBySlug(tenantId, req.params.slug);

    if (!clinic) {
      throw AppError.from({ statusCode: StatusCodes.NOT_FOUND, message: "Clinic not found" });
    }

    return res.json(successResponse(clinic.toObject?.() ?? clinic));
  }
);

export const handleUpdateClinic = catchAsync<
  { id: string },
  unknown,
  UpdateClinicInput
>(async (req: AuthenticatedRequest<{ id: string }, unknown, UpdateClinicInput>, res: Response) => {
  const tenantId = requireTenantId(req);
  if (req.user?.role !== "admin") {
    throw AppError.from({ statusCode: StatusCodes.FORBIDDEN, message: "Only admins can update clinics" });
  }

  const clinic = await updateClinic(tenantId, req.params.id, req.body);
  if (!clinic) {
    throw AppError.from({ statusCode: StatusCodes.NOT_FOUND, message: "Clinic not found" });
  }

  return res.json(successResponse(clinic.toObject?.() ?? clinic, "Clinic updated"));
});


