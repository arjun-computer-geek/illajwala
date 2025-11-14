import type { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { AuthenticatedRequest } from '../../utils';
import { successResponse, catchAsync, AppError } from '../../utils';
import type {
  AddDependentInput,
  UpdateNotificationPreferencesInput,
  UpdatePatientInput,
} from './patient.schema';
import {
  addDependent,
  getPatientById,
  getNotificationPreferences,
  removeDependent,
  updateNotificationPreferences,
  updatePatientProfile,
} from './patient.service';

export const handleGetProfile = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw AppError.from({ statusCode: StatusCodes.UNAUTHORIZED, message: 'Unauthorized' });
  }

  if (!req.user.tenantId) {
    throw AppError.from({ statusCode: StatusCodes.FORBIDDEN, message: 'Tenant context missing' });
  }

  const patient = await getPatientById(req.user.id, req.user.tenantId);
  if (!patient) {
    throw AppError.from({ statusCode: StatusCodes.NOT_FOUND, message: 'Patient not found' });
  }

  return res.json(successResponse(patient));
});

export const handleUpdateProfile = catchAsync<Record<string, never>, unknown, UpdatePatientInput>(
  async (
    req: AuthenticatedRequest<Record<string, never>, unknown, UpdatePatientInput>,
    res: Response,
  ) => {
    if (!req.user) {
      throw AppError.from({ statusCode: StatusCodes.UNAUTHORIZED, message: 'Unauthorized' });
    }

    if (!req.user.tenantId) {
      throw AppError.from({ statusCode: StatusCodes.FORBIDDEN, message: 'Tenant context missing' });
    }

    const patient = await updatePatientProfile(req.user.id, req.user.tenantId, req.body);
    if (!patient) {
      throw AppError.from({ statusCode: StatusCodes.NOT_FOUND, message: 'Patient not found' });
    }

    return res.json(successResponse(patient, 'Profile updated'));
  },
);

export const handleAddDependent = catchAsync<Record<string, never>, unknown, AddDependentInput>(
  async (
    req: AuthenticatedRequest<Record<string, never>, unknown, AddDependentInput>,
    res: Response,
  ) => {
    if (!req.user) {
      throw AppError.from({ statusCode: StatusCodes.UNAUTHORIZED, message: 'Unauthorized' });
    }

    if (!req.user.tenantId) {
      throw AppError.from({ statusCode: StatusCodes.FORBIDDEN, message: 'Tenant context missing' });
    }

    const patient = await addDependent(req.user.id, req.user.tenantId, req.body);
    return res.status(StatusCodes.CREATED).json(successResponse(patient, 'Dependent added'));
  },
);

export const handleRemoveDependent = catchAsync<{ name: string }>(
  async (req: AuthenticatedRequest<{ name: string }>, res: Response) => {
    if (!req.user) {
      throw AppError.from({ statusCode: StatusCodes.UNAUTHORIZED, message: 'Unauthorized' });
    }

    const { name } = req.params;

    if (!name) {
      throw AppError.from({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Dependent name is required',
      });
    }

    if (!req.user.tenantId) {
      throw AppError.from({ statusCode: StatusCodes.FORBIDDEN, message: 'Tenant context missing' });
    }

    const patient = await removeDependent(req.user.id, req.user.tenantId, name);

    return res.json(successResponse(patient, 'Dependent removed'));
  },
);

export const handleGetNotificationPreferences = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw AppError.from({ statusCode: StatusCodes.UNAUTHORIZED, message: 'Unauthorized' });
    }

    if (!req.user.tenantId) {
      throw AppError.from({ statusCode: StatusCodes.FORBIDDEN, message: 'Tenant context missing' });
    }

    const preferences = await getNotificationPreferences(req.user.id, req.user.tenantId);
    return res.json(successResponse(preferences));
  },
);

export const handleUpdateNotificationPreferences = catchAsync<
  Record<string, never>,
  unknown,
  UpdateNotificationPreferencesInput
>(
  async (
    req: AuthenticatedRequest<Record<string, never>, unknown, UpdateNotificationPreferencesInput>,
    res: Response,
  ) => {
    if (!req.user) {
      throw AppError.from({ statusCode: StatusCodes.UNAUTHORIZED, message: 'Unauthorized' });
    }

    if (!req.user.tenantId) {
      throw AppError.from({ statusCode: StatusCodes.FORBIDDEN, message: 'Tenant context missing' });
    }

    const preferences = await updateNotificationPreferences(
      req.user.id,
      req.user.tenantId,
      req.body,
    );
    return res.json(successResponse(preferences, 'Notification preferences updated'));
  },
);
