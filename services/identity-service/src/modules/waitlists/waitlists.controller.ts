import type { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  successResponse,
  paginateResponse,
  catchAsync,
  AppError,
  type AuthenticatedRequest,
  requireTenantId,
} from '../../utils';
import {
  enqueueWaitlistEntry,
  listWaitlistEntries,
  updateWaitlistStatus,
  markWaitlistEntryPromoted,
  getWaitlistEntryById,
  upsertWaitlistPolicy,
  getWaitlistPolicy,
  bulkUpdateWaitlistStatus,
  updateWaitlistPriority,
  getWaitlistAnalytics,
} from './waitlist.service';
import type {
  CreateWaitlistEntryInput,
  ListWaitlistQuery,
  PromoteWaitlistEntryInput,
  UpdateWaitlistStatusInput,
  UpsertWaitlistPolicyInput,
  WaitlistStatusValue,
  BulkUpdateWaitlistStatusInput,
  UpdateWaitlistPriorityInput,
} from './waitlist.schema';
import {
  waitlistStatusSchema,
  bulkUpdateWaitlistStatusSchema,
  updateWaitlistPrioritySchema,
} from './waitlist.schema';

const parseStatuses = (raw?: string): WaitlistStatusValue[] | undefined => {
  if (!raw) {
    return undefined;
  }
  const tokens = raw
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);

  const statuses: WaitlistStatusValue[] = [];
  for (const token of tokens) {
    const parsed = waitlistStatusSchema.safeParse(token);
    if (parsed.success) {
      statuses.push(parsed.data);
    }
  }

  return statuses.length > 0 ? statuses : undefined;
};

export const handleCreateWaitlistEntry = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = requireTenantId(req);
    const body = req.body as CreateWaitlistEntryInput;

    if (req.user?.role === 'patient' && req.user.id !== body.patientId) {
      throw AppError.from({
        statusCode: StatusCodes.FORBIDDEN,
        message: 'Patients can only join waitlists for their own profile',
      });
    }

    const requestedWindow = body.requestedWindow
      ? {
          ...(body.requestedWindow.start ? { start: body.requestedWindow.start } : {}),
          ...(body.requestedWindow.end ? { end: body.requestedWindow.end } : {}),
          ...(body.requestedWindow.notes ? { notes: body.requestedWindow.notes } : {}),
        }
      : undefined;

    const enqueuePayload: Parameters<typeof enqueueWaitlistEntry>[0] = {
      tenantId,
      patientId: body.patientId,
      actorId: req.user?.id,
    };

    if (body.clinicId) {
      enqueuePayload.clinicId = body.clinicId;
    }
    if (body.doctorId) {
      enqueuePayload.doctorId = body.doctorId;
    }
    if (requestedWindow) {
      enqueuePayload.requestedWindow = requestedWindow;
    }
    if (body.notes !== undefined) {
      enqueuePayload.notes = body.notes;
    }
    if (body.metadata !== undefined) {
      enqueuePayload.metadata = body.metadata;
    }

    const entry = await enqueueWaitlistEntry(enqueuePayload);

    return res
      .status(StatusCodes.CREATED)
      .json(successResponse(entry.toObject?.() ?? entry, 'Waitlist entry created'));
  },
);

export const handleListWaitlistEntries = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = requireTenantId(req);
    const query = req.query as ListWaitlistQuery;

    const statuses = parseStatuses(query.status);
    const statusFilter =
      statuses && statuses.length > 0
        ? statuses.length === 1
          ? statuses[0]
          : statuses
        : undefined;

    const listOptions: Parameters<typeof listWaitlistEntries>[0] = { tenantId };

    if (query.page !== undefined) {
      listOptions.page = query.page;
    }
    if (query.pageSize !== undefined) {
      listOptions.pageSize = query.pageSize;
    }
    if (query.sortBy) {
      listOptions.sortBy = query.sortBy;
    }
    if (query.clinicId) {
      listOptions.clinicId = query.clinicId;
    }
    if (req.user?.role === 'doctor') {
      listOptions.doctorId = req.user.id;
    } else if (query.doctorId) {
      listOptions.doctorId = query.doctorId;
    }
    if (statusFilter) {
      listOptions.status = statusFilter;
    }

    const { items, total } = await listWaitlistEntries(listOptions);

    const serialized = items.map((item) => item.toObject?.() ?? item);

    return res.json(
      paginateResponse(serialized, total, listOptions.page ?? 1, listOptions.pageSize ?? 20),
    );
  },
);

export const handleGetPatientWaitlists = catchAsync<{ patientId: string }>(
  async (req: AuthenticatedRequest<{ patientId: string }>, res: Response) => {
    const tenantId = requireTenantId(req);
    const { patientId } = req.params;

    if (req.user?.role === 'patient' && req.user.id !== patientId) {
      throw AppError.from({
        statusCode: StatusCodes.FORBIDDEN,
        message: 'You can only view your own waitlist entries',
      });
    }

    const { items } = await listWaitlistEntries({
      tenantId,
      patientId,
      page: 1,
      pageSize: 100,
      sortBy: 'priority',
    });

    const serialized = items.map((item) => item.toObject?.() ?? item);

    return res.json(successResponse(serialized));
  },
);

export const handleUpdateWaitlistStatus = catchAsync<
  { id: string },
  unknown,
  UpdateWaitlistStatusInput
>(
  async (
    req: AuthenticatedRequest<{ id: string }, unknown, UpdateWaitlistStatusInput>,
    res: Response,
  ) => {
    const tenantId = requireTenantId(req);
    const body = req.body as UpdateWaitlistStatusInput;
    const params = req.params as { id: string };

    const entry = await getWaitlistEntryById(tenantId, params.id);

    if (!entry) {
      throw AppError.from({
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Waitlist entry not found',
      });
    }

    if (req.user?.role === 'doctor') {
      const allowedStatuses: WaitlistStatusValue[] = ['invited', 'cancelled'];
      if (!allowedStatuses.includes(body.status)) {
        throw AppError.from({
          statusCode: StatusCodes.FORBIDDEN,
          message: 'Doctors can only mark waitlist entries as invited or cancelled',
        });
      }

      if (!entry.doctorId || String(entry.doctorId) !== req.user.id) {
        throw AppError.from({
          statusCode: StatusCodes.FORBIDDEN,
          message: 'You cannot modify waitlist entries assigned to other doctors',
        });
      }
    }

    const updatePayload: Parameters<typeof updateWaitlistStatus>[0] = {
      tenantId,
      entryId: params.id,
      status: body.status,
      actorId: req.user?.id,
    };

    if (body.notes !== undefined) {
      updatePayload.notes = body.notes;
    }

    const updatedEntry = await updateWaitlistStatus(updatePayload);

    return res.json(
      successResponse(updatedEntry.toObject?.() ?? updatedEntry, 'Waitlist status updated'),
    );
  },
);

export const handlePromoteWaitlistEntry = catchAsync<
  { id: string },
  unknown,
  PromoteWaitlistEntryInput
>(
  async (
    req: AuthenticatedRequest<{ id: string }, unknown, PromoteWaitlistEntryInput>,
    res: Response,
  ) => {
    const tenantId = requireTenantId(req);
    const params = req.params as { id: string };
    const body = req.body as PromoteWaitlistEntryInput;

    const entry = await getWaitlistEntryById(tenantId, params.id);

    if (!entry) {
      throw AppError.from({
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Waitlist entry not found',
      });
    }

    if (req.user?.role === 'doctor') {
      if (!entry.doctorId || String(entry.doctorId) !== req.user.id) {
        throw AppError.from({
          statusCode: StatusCodes.FORBIDDEN,
          message: 'You cannot promote waitlist entries assigned to other doctors',
        });
      }
    }

    const promotePayload: Parameters<typeof markWaitlistEntryPromoted>[0] = {
      tenantId,
      entryId: params.id,
      appointmentId: body.appointmentId,
      actorId: req.user?.id,
    };

    if (body.notes !== undefined) {
      promotePayload.notes = body.notes;
    }

    const promotedEntry = await markWaitlistEntryPromoted(promotePayload);

    return res.json(
      successResponse(promotedEntry.toObject?.() ?? promotedEntry, 'Waitlist entry promoted'),
    );
  },
);

export const handleGetWaitlistEntry = catchAsync<{ id: string }>(
  async (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
    const tenantId = requireTenantId(req);
    const entry = await getWaitlistEntryById(tenantId, req.params.id);

    if (!entry) {
      throw AppError.from({
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Waitlist entry not found',
      });
    }

    return res.json(successResponse(entry.toObject?.() ?? entry));
  },
);

export const handleUpsertWaitlistPolicy = catchAsync<
  Record<string, never>,
  unknown,
  UpsertWaitlistPolicyInput
>(
  async (
    req: AuthenticatedRequest<Record<string, never>, unknown, UpsertWaitlistPolicyInput>,
    res: Response,
  ) => {
    const tenantId = requireTenantId(req);
    const body = req.body as UpsertWaitlistPolicyInput;

    const payload: Parameters<typeof upsertWaitlistPolicy>[0] = {
      tenantId,
    };

    if (body.clinicId) {
      payload.clinicId = body.clinicId;
    }
    if (body.maxQueueSize !== undefined) {
      payload.maxQueueSize = body.maxQueueSize;
    }
    if (body.autoExpiryHours !== undefined) {
      payload.autoExpiryHours = body.autoExpiryHours;
    }
    if (body.autoPromoteBufferMinutes !== undefined) {
      payload.autoPromoteBufferMinutes = body.autoPromoteBufferMinutes;
    }
    if (body.priorityWeights !== undefined) {
      payload.priorityWeights = body.priorityWeights;
    }
    if (body.notificationTemplateOverrides !== undefined) {
      payload.notificationTemplateOverrides = body.notificationTemplateOverrides;
    }

    const policy = await upsertWaitlistPolicy(payload);

    return res.json(successResponse(policy.toObject?.() ?? policy, 'Waitlist policy updated'));
  },
);

export const handleGetWaitlistPolicy = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = requireTenantId(req);
    const query = req.query as { clinicId?: string };
    const clinicId = query.clinicId && query.clinicId.length > 0 ? query.clinicId : undefined;

    const policy = await getWaitlistPolicy(tenantId, clinicId);
    return res.json(successResponse(policy.toObject?.() ?? policy));
  },
);

export const handleBulkUpdateWaitlistStatus = catchAsync<
  Record<string, never>,
  unknown,
  BulkUpdateWaitlistStatusInput
>(
  async (
    req: AuthenticatedRequest<Record<string, never>, unknown, BulkUpdateWaitlistStatusInput>,
    res: Response,
  ) => {
    const tenantId = requireTenantId(req);
    const body = req.body as BulkUpdateWaitlistStatusInput;

    const result = await bulkUpdateWaitlistStatus({
      tenantId,
      entryIds: body.entryIds,
      status: body.status,
      actorId: req.user?.id,
      ...(body.notes ? { notes: body.notes } : {}),
    });

    return res.json(
      successResponse(result, `Updated ${result.modified} of ${result.matched} waitlist entries`),
    );
  },
);

export const handleUpdateWaitlistPriority = catchAsync<
  { id: string },
  unknown,
  UpdateWaitlistPriorityInput
>(
  async (
    req: AuthenticatedRequest<{ id: string }, unknown, UpdateWaitlistPriorityInput>,
    res: Response,
  ) => {
    const tenantId = requireTenantId(req);
    const params = req.params as { id: string };
    const body = req.body as UpdateWaitlistPriorityInput;

    const entry = await getWaitlistEntryById(tenantId, params.id);

    if (!entry) {
      throw AppError.from({
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Waitlist entry not found',
      });
    }

    if (req.user?.role === 'doctor') {
      if (!entry.doctorId || String(entry.doctorId) !== req.user.id) {
        throw AppError.from({
          statusCode: StatusCodes.FORBIDDEN,
          message: 'You cannot modify waitlist entries assigned to other doctors',
        });
      }
    }

    const updatedEntry = await updateWaitlistPriority({
      tenantId,
      entryId: params.id,
      priorityScore: body.priorityScore,
      actorId: req.user?.id,
      ...(body.notes ? { notes: body.notes } : {}),
    });

    return res.json(
      successResponse(updatedEntry.toObject?.() ?? updatedEntry, 'Waitlist priority updated'),
    );
  },
);

export const handleGetWaitlistAnalytics = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = requireTenantId(req);
    const query = req.query as {
      doctorId?: string;
      clinicId?: string;
      startDate?: string;
      endDate?: string;
    };

    const analyticsInput: Parameters<typeof getWaitlistAnalytics>[0] = {
      tenantId,
    };

    if (req.user?.role === 'doctor') {
      analyticsInput.doctorId = req.user.id;
    } else if (query.doctorId) {
      analyticsInput.doctorId = query.doctorId;
    }

    if (query.clinicId) {
      analyticsInput.clinicId = query.clinicId;
    }

    if (query.startDate) {
      analyticsInput.startDate = new Date(query.startDate);
    }

    if (query.endDate) {
      analyticsInput.endDate = new Date(query.endDate);
    }

    const analytics = await getWaitlistAnalytics(analyticsInput);

    return res.json(successResponse(analytics));
  },
);
