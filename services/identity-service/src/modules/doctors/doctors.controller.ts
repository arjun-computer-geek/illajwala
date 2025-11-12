import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { successResponse, paginateResponse } from "../../utils/api-response";
import { catchAsync } from "../../utils/catch-async";
import { AppError } from "../../utils/app-error";
import type {
  CreateDoctorInput,
  UpdateDoctorInput,
  DoctorSearchParams,
  DoctorAvailabilityParams,
} from "./doctor.schema";
import {
  createDoctor,
  getDoctorById,
  listDoctorSpecialties,
  searchDoctors,
  updateDoctor,
  getDoctorAvailability,
} from "./doctor.service";

export const handleListSpecialties = catchAsync(async (_req: Request, res: Response) => {
  const specialties = await listDoctorSpecialties();
  return res.json(successResponse(specialties));
});

export const handleCreateDoctor = catchAsync<
  Record<string, never>,
  unknown,
  CreateDoctorInput
>(async (req: Request<Record<string, never>, unknown, CreateDoctorInput>, res: Response) => {
  const doctor = await createDoctor(req.body);
  return res.status(StatusCodes.CREATED).json(successResponse(doctor, "Doctor created"));
});

export const handleUpdateDoctor = catchAsync<
  { id: string },
  unknown,
  UpdateDoctorInput
>(async (req: Request<{ id: string }, unknown, UpdateDoctorInput>, res: Response) => {
  const doctor = await updateDoctor(req.params.id, req.body);

  if (!doctor) {
    throw AppError.from({ statusCode: StatusCodes.NOT_FOUND, message: "Doctor not found" });
  }

  return res.json(successResponse(doctor, "Doctor updated"));
});

export const handleGetDoctor = catchAsync<{ id: string }>(
  async (req: Request<{ id: string }>, res: Response) => {
    const doctor = await getDoctorById(req.params.id);

    if (!doctor) {
      throw AppError.from({ statusCode: StatusCodes.NOT_FOUND, message: "Doctor not found" });
    }

    return res.json(successResponse(doctor));
  }
);

export const handleSearchDoctors = catchAsync<
  Record<string, string | string[] | undefined>,
  unknown,
  unknown,
  DoctorSearchParams
>(async (req: Request<Record<string, string | string[] | undefined>, unknown, unknown, DoctorSearchParams>, res: Response) => {
  const page = req.query.page ?? 1;
  const pageSize = req.query.pageSize ?? 20;

  const { items, total } = await searchDoctors({
    ...req.query,
    page,
    pageSize,
  });

  return res.json(paginateResponse(items, total, page, pageSize));
});

export const handleGetDoctorAvailability = catchAsync<
  { id: string },
  unknown,
  unknown,
  DoctorAvailabilityParams
>(async (req: Request<{ id: string }, unknown, unknown, DoctorAvailabilityParams>, res: Response) => {
  const availability = await getDoctorAvailability(req.params.id, req.query);

  if (!availability) {
    throw AppError.from({ statusCode: StatusCodes.NOT_FOUND, message: "Doctor not found" });
  }

  return res.json(successResponse(availability));
});
