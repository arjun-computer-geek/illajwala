import type { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { successResponse, paginateResponse, AppError, catchAsync } from '../../utils';
import type {
  CreateAppointmentInput,
  UpdateAppointmentStatusInput,
  ConfirmAppointmentPaymentInput,
  UpdateAppointmentPaymentInput,
} from './appointment.schema';
import { getServiceClients } from '../../config/service-clients';
import type { AuthenticatedRequest } from '../../utils';
import { requireTenantId } from '../../utils';
import type { BookAppointmentPayload } from '@illajwala/types';

export const handleCreateAppointment = catchAsync<
  Record<string, never>,
  unknown,
  CreateAppointmentInput
>(
  async (
    req: AuthenticatedRequest<Record<string, never>, unknown, CreateAppointmentInput>,
    res: Response,
  ) => {
    const { appointment } = getServiceClients(req);
    const payload: BookAppointmentPayload = {
      doctorId: req.body.doctorId,
      patientId: req.body.patientId,
      clinicId: req.body.clinicId,
      scheduledAt:
        req.body.scheduledAt instanceof Date
          ? req.body.scheduledAt.toISOString()
          : req.body.scheduledAt,
      mode: req.body.mode,
      reasonForVisit: req.body.reasonForVisit,
    };
    const result = await appointment.createAppointment(payload);
    return res.status(StatusCodes.CREATED).json(
      successResponse(
        {
          appointment: result.appointment,
          payment: result.payment,
        },
        'Appointment created',
      ),
    );
  },
);

export const handleListAppointments = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? req.query.pageSize ?? 20);
    const { patientId, doctorId, status, startDate, endDate } = req.query as {
      patientId?: string;
      doctorId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    };
    const { appointment } = getServiceClients(req);
    const params: {
      patientId?: string;
      doctorId?: string;
      status?: any;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    } = { page, limit };
    if (patientId) params.patientId = patientId;
    if (doctorId) params.doctorId = doctorId;
    if (status) params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const result = await appointment.listAppointments(params);
    return res.json(paginateResponse(result.appointments, result.total, page, limit));
  },
);

export const handleUpdateAppointmentStatus = catchAsync<
  { id: string },
  unknown,
  UpdateAppointmentStatusInput
>(
  async (
    req: AuthenticatedRequest<{ id: string }, unknown, UpdateAppointmentStatusInput>,
    res: Response,
  ) => {
    const { appointment } = getServiceClients(req);
    const updated = await appointment.updateAppointmentStatus(
      req.params.id,
      req.body.status,
      req.body.notes,
    );
    return res.json(successResponse(updated, 'Appointment updated'));
  },
);

export const handleConfirmAppointmentPayment = catchAsync<
  { id: string },
  unknown,
  ConfirmAppointmentPaymentInput
>(
  async (
    req: AuthenticatedRequest<{ id: string }, unknown, ConfirmAppointmentPaymentInput>,
    res: Response,
  ) => {
    const { appointment } = getServiceClients(req);
    const confirmed = await appointment.confirmPayment(req.params.id, req.body);
    return res.json(successResponse(confirmed, 'Payment confirmed'));
  },
);

export const handleUpdateAppointmentPayment = catchAsync<
  { id: string },
  unknown,
  UpdateAppointmentPaymentInput
>(
  async (
    req: AuthenticatedRequest<{ id: string }, unknown, UpdateAppointmentPaymentInput>,
    res: Response,
  ) => {
    // This endpoint might not be needed after migration
    // For now, return error
    throw AppError.from({
      statusCode: StatusCodes.NOT_IMPLEMENTED,
      message: 'Payment update should be handled by payment service',
    });
  },
);
