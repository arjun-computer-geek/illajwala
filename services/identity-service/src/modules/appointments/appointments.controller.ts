import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { successResponse, paginateResponse } from "../../utils/api-response";
import { AppError } from "../../utils/app-error";
import { catchAsync } from "../../utils/catch-async";
import type {
  CreateAppointmentInput,
  UpdateAppointmentStatusInput,
  ConfirmAppointmentPaymentInput,
  UpdateAppointmentPaymentInput,
} from "./appointment.schema";
import {
  createAppointment,
  listAppointments,
  updateAppointmentStatus,
  confirmAppointmentPayment,
  updateAppointmentPayment,
} from "./appointment.service";
import type { AuthenticatedRequest } from "../../middlewares/auth";

export const handleCreateAppointment = catchAsync<
  Record<string, never>,
  unknown,
  CreateAppointmentInput
>(async (req: AuthenticatedRequest<Record<string, never>, unknown, CreateAppointmentInput>, res: Response) => {
  const { appointment, paymentOrder } = await createAppointment(req.body, req.user);
  return res
    .status(StatusCodes.CREATED)
    .json(
      successResponse(
        {
          appointment,
          payment: paymentOrder,
        },
        "Appointment created"
      )
    );
});

export const handleListAppointments = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const pageSize = Number(req.query.pageSize ?? 20);
  const { patientId, doctorId, status } = req.query as { patientId?: string; doctorId?: string; status?: string };

  const filters: { patientId?: string; doctorId?: string; status?: string } = {};
  if (patientId) {
    filters.patientId = patientId;
  }
  if (doctorId) {
    filters.doctorId = doctorId;
  }
  if (status && typeof status === "string") {
    filters.status = status;
  }

  const { items, total } = await listAppointments({
    page,
    pageSize,
    ...filters,
    requester: req.user,
  });

  return res.json(paginateResponse(items, total, page, pageSize));
});

export const handleUpdateAppointmentStatus = catchAsync<
  { id: string },
  unknown,
  UpdateAppointmentStatusInput
>(async (req: AuthenticatedRequest<{ id: string }, unknown, UpdateAppointmentStatusInput>, res: Response) => {
  const appointment = await updateAppointmentStatus(req.params.id, req.body, req.user);

  if (!appointment) {
    throw AppError.from({ statusCode: StatusCodes.NOT_FOUND, message: "Appointment not found" });
  }

  return res.json(successResponse(appointment, "Appointment updated"));
});

export const handleConfirmAppointmentPayment = catchAsync<
  { id: string },
  unknown,
  ConfirmAppointmentPaymentInput
>(
  async (
    req: AuthenticatedRequest<{ id: string }, unknown, ConfirmAppointmentPaymentInput>,
    res: Response
  ) => {
    const appointment = await confirmAppointmentPayment(req.params.id, req.body, req.user);
    return res.json(successResponse(appointment, "Payment confirmed"));
  }
);

export const handleUpdateAppointmentPayment = catchAsync<
  { id: string },
  unknown,
  UpdateAppointmentPaymentInput
>(
  async (
    req: AuthenticatedRequest<{ id: string }, unknown, UpdateAppointmentPaymentInput>,
    res: Response
  ) => {
    const appointment = await updateAppointmentPayment(req.params.id, req.body, req.user);
    return res.json(successResponse(appointment, "Appointment payment updated"));
  }
);

