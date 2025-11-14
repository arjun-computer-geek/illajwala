import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import {
  WaitlistModel,
  WaitlistPolicyModel,
  type WaitlistEntryDocument,
  type WaitlistPolicyDocument,
  type WaitlistStatus,
} from './waitlist.model';
import { AppError } from '../../utils/app-error';
import { publishWaitlistEvent } from '../events/waitlist-events.publisher';
import { PatientModel, defaultNotificationPreferences } from '../patients/patient.model';
import type {
  PatientNotificationPreferences,
  WaitlistCancelledEvent,
  WaitlistEvent,
  WaitlistExpiredEvent,
  WaitlistInvitedEvent,
  WaitlistJoinedEvent,
  WaitlistPromotedEvent,
} from '@illajwala/types';

const ACTIVE_STATUSES: WaitlistStatus[] = ['active', 'invited'];

const DEFAULT_WAITLIST_POLICY = {
  maxQueueSize: 250,
  autoExpiryHours: 72,
  autoPromoteBufferMinutes: 30,
};

type ObjectIdLike = string | Types.ObjectId | undefined | null;

const toObjectId = (value: ObjectIdLike): Types.ObjectId | undefined => {
  if (!value) {
    return undefined;
  }
  if (value instanceof Types.ObjectId) {
    return value;
  }
  if (Types.ObjectId.isValid(value)) {
    return new Types.ObjectId(value);
  }
  return undefined;
};

type PatientContext = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  notificationPreferences: PatientNotificationPreferences;
};

const mergeNotificationPreferences = (
  preferences?: Partial<PatientNotificationPreferences> | null,
): PatientNotificationPreferences => ({
  ...defaultNotificationPreferences,
  ...(preferences ?? {}),
});

const getPatientContext = async (
  tenantId: string,
  patientId: ObjectIdLike,
): Promise<PatientContext | null> => {
  const id = toObjectId(patientId);
  if (!id) {
    return null;
  }

  const patient = await PatientModel.findOne({ _id: id, tenantId })
    .select('name email phone notificationPreferences')
    .lean<{
      name?: string;
      email?: string;
      phone?: string;
      notificationPreferences?: PatientNotificationPreferences | null;
    }>();

  if (!patient) {
    return null;
  }

  return {
    name: patient.name ?? null,
    email: patient.email ?? null,
    phone: patient.phone ?? null,
    notificationPreferences: mergeNotificationPreferences(patient.notificationPreferences),
  };
};

const applyPatientContext = <T extends WaitlistEvent>(
  event: T,
  context: PatientContext | null,
): T => {
  if (!context) {
    return event;
  }

  return {
    ...event,
    patientName: context.name ?? null,
    patientEmail: context.email ?? null,
    patientPhone: context.phone ?? null,
    notificationPreferences: context.notificationPreferences,
  };
};

const createAuditEntry = (
  action: WaitlistEntryDocument['audit'][number]['action'],
  actorId?: ObjectIdLike,
  notes?: string,
  metadata?: Record<string, unknown>,
): WaitlistEntryDocument['audit'][number] => {
  const entry: WaitlistEntryDocument['audit'][number] = {
    action,
    createdAt: new Date(),
  };

  const actorObjectId = toObjectId(actorId);
  if (actorObjectId) {
    entry.actorId = actorObjectId;
  } else if (actorId !== undefined) {
    entry.actorId = null;
  }

  if (notes !== undefined) {
    entry.notes = notes;
  }
  if (metadata) {
    entry.metadata = metadata;
  }

  return entry;
};

const calculatePriorityScore = (): number => {
  // Simple FIFO scoring for now; lower scores are promoted first.
  return Date.now();
};

const applyPolicyFallback = async (
  tenantId: string,
  clinicId?: Types.ObjectId | null,
): Promise<WaitlistPolicyDocument | null> => {
  const query: Record<string, unknown> = { tenantId };
  if (clinicId) {
    query.clinicId = clinicId;
  } else {
    query.clinicId = null;
  }

  const policy = await WaitlistPolicyModel.findOne(query);
  if (policy) {
    return policy;
  }

  if (clinicId) {
    // fall back to tenant-wide default (clinicId null)
    const tenantDefault = await WaitlistPolicyModel.findOne({ tenantId, clinicId: null });
    if (tenantDefault) {
      return tenantDefault;
    }
  }

  return null;
};

const resolvePolicyValues = (policy?: WaitlistPolicyDocument | null) => ({
  maxQueueSize: policy?.maxQueueSize ?? DEFAULT_WAITLIST_POLICY.maxQueueSize,
  autoExpiryHours: policy?.autoExpiryHours ?? DEFAULT_WAITLIST_POLICY.autoExpiryHours,
  autoPromoteBufferMinutes:
    policy?.autoPromoteBufferMinutes ?? DEFAULT_WAITLIST_POLICY.autoPromoteBufferMinutes,
  priorityWeights: policy?.priorityWeights ?? {},
  notificationTemplateOverrides: policy?.notificationTemplateOverrides ?? {},
});

export type EnqueueWaitlistInput = {
  tenantId: string;
  clinicId?: ObjectIdLike;
  doctorId?: ObjectIdLike;
  patientId: ObjectIdLike;
  requestedWindow?: {
    start?: Date;
    end?: Date;
    notes?: string;
  };
  notes?: string;
  metadata?: Record<string, unknown>;
  actorId?: ObjectIdLike;
};

export const enqueueWaitlistEntry = async (input: EnqueueWaitlistInput) => {
  const { tenantId } = input;
  const clinicId = toObjectId(input.clinicId);
  const doctorId = toObjectId(input.doctorId);
  const patientId = toObjectId(input.patientId);

  if (!patientId) {
    throw AppError.from({
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Patient identifier is required for waitlist entries',
    });
  }

  const policyDoc = await applyPolicyFallback(tenantId, clinicId ?? null);
  const policy = resolvePolicyValues(policyDoc);

  const duplicateFilter: Record<string, unknown> = {
    tenantId,
    patientId,
    status: { $in: ACTIVE_STATUSES },
  };
  if (clinicId) {
    duplicateFilter.clinicId = clinicId;
  }
  if (doctorId) {
    duplicateFilter.doctorId = doctorId;
  }

  const existingActive = await WaitlistModel.findOne(duplicateFilter);
  if (existingActive) {
    throw AppError.from({
      statusCode: StatusCodes.CONFLICT,
      message: 'An active waitlist entry already exists for this patient',
    });
  }

  const capacityFilter: Record<string, unknown> = {
    tenantId,
    status: { $in: ACTIVE_STATUSES },
  };
  if (clinicId) {
    capacityFilter.clinicId = clinicId;
  }
  const activeCount = await WaitlistModel.countDocuments(capacityFilter);
  if (activeCount >= policy.maxQueueSize) {
    throw AppError.from({
      statusCode: StatusCodes.CONFLICT,
      message: 'The waitlist is currently at capacity',
    });
  }

  const patientContext = await getPatientContext(tenantId, patientId);
  if (!patientContext) {
    throw AppError.from({
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Patient not found',
    });
  }

  const now = new Date();
  const expiresAt =
    policy.autoExpiryHours > 0
      ? new Date(now.getTime() + policy.autoExpiryHours * 60 * 60 * 1000)
      : undefined;

  const entry = await WaitlistModel.create({
    tenantId,
    clinicId: clinicId ?? undefined,
    doctorId: doctorId ?? undefined,
    patientId,
    status: 'active',
    priorityScore: calculatePriorityScore(),
    requestedWindow: input.requestedWindow
      ? {
          start: input.requestedWindow.start,
          end: input.requestedWindow.end,
          notes: input.requestedWindow.notes,
        }
      : undefined,
    notes: input.notes,
    metadata: input.metadata,
    expiresAt,
    audit: [createAuditEntry('created', input.actorId, input.notes)],
  });

  const waitlistJoinedEvent = applyPatientContext<WaitlistJoinedEvent>(
    {
      type: 'waitlist.joined',
      tenantId,
      entryId: String(entry._id),
      clinicId: clinicId ? String(clinicId) : null,
      doctorId: doctorId ? String(doctorId) : null,
      patientId: String(patientId),
      priorityScore: entry.priorityScore,
    },
    patientContext,
  );

  if (
    entry.requestedWindow &&
    (entry.requestedWindow.start || entry.requestedWindow.end || entry.requestedWindow.notes)
  ) {
    waitlistJoinedEvent.requestedWindow = {
      start: entry.requestedWindow.start ? entry.requestedWindow.start.toISOString() : null,
      end: entry.requestedWindow.end ? entry.requestedWindow.end.toISOString() : null,
      notes: entry.requestedWindow.notes ?? null,
    };
  }

  if (input.metadata) {
    waitlistJoinedEvent.metadata = input.metadata;
  }

  await publishWaitlistEvent(waitlistJoinedEvent);

  return entry;
};

export type ListWaitlistOptions = {
  tenantId: string;
  clinicId?: ObjectIdLike;
  doctorId?: ObjectIdLike;
  patientId?: ObjectIdLike;
  status?: WaitlistStatus | WaitlistStatus[];
  page?: number;
  pageSize?: number;
  sortBy?: 'priority' | 'createdAt';
};

export const listWaitlistEntries = async ({
  tenantId,
  clinicId,
  doctorId,
  status,
  patientId,
  page = 1,
  pageSize = 20,
  sortBy = 'priority',
}: ListWaitlistOptions) => {
  const filter: Record<string, unknown> = { tenantId };

  const normalizedClinicId = toObjectId(clinicId);
  if (normalizedClinicId) {
    filter.clinicId = normalizedClinicId;
  }
  const normalizedDoctorId = toObjectId(doctorId);
  if (normalizedDoctorId) {
    filter.doctorId = normalizedDoctorId;
  }
  const normalizedPatientId = toObjectId(patientId);
  if (normalizedPatientId) {
    filter.patientId = normalizedPatientId;
  }

  if (status) {
    filter.status = Array.isArray(status) ? { $in: status } : status;
  }

  const sort: Record<string, 1 | -1> =
    sortBy === 'createdAt'
      ? { createdAt: 1 }
      : {
          priorityScore: 1,
          createdAt: 1,
        };

  const [items, total] = await Promise.all([
    WaitlistModel.find(filter)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    WaitlistModel.countDocuments(filter),
  ]);

  return { items, total };
};

export const getWaitlistEntryById = async (tenantId: string, id: ObjectIdLike) => {
  const entryId = toObjectId(id);
  if (!entryId) {
    return null;
  }
  return WaitlistModel.findOne({ _id: entryId, tenantId });
};

export type UpdateWaitlistStatusInput = {
  tenantId: string;
  entryId: ObjectIdLike;
  status: WaitlistStatus;
  actorId?: ObjectIdLike;
  notes?: string;
};

export const updateWaitlistStatus = async ({
  tenantId,
  entryId,
  status,
  actorId,
  notes,
}: UpdateWaitlistStatusInput) => {
  const id = toObjectId(entryId);
  if (!id) {
    throw AppError.from({
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Invalid waitlist entry identifier',
    });
  }

  const entry = await WaitlistModel.findOne({ _id: id, tenantId });
  if (!entry) {
    throw AppError.from({
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Waitlist entry not found',
    });
  }

  if (entry.status === status) {
    return entry;
  }

  const previousStatus = entry.status;
  entry.status = status;
  entry.audit.push(createAuditEntry('status-change', actorId, notes, { status }));
  if (notes && status !== 'cancelled') {
    entry.notes = notes;
  }

  await entry.save();

  const patientContext = await getPatientContext(tenantId, entry.patientId);

  if (previousStatus !== status) {
    if (status === 'cancelled') {
      const event = applyPatientContext<WaitlistCancelledEvent>(
        {
          type: 'waitlist.cancelled',
          tenantId,
          entryId: String(entry._id),
          clinicId: entry.clinicId ? String(entry.clinicId) : null,
          doctorId: entry.doctorId ? String(entry.doctorId) : null,
          patientId: String(entry.patientId),
        },
        patientContext,
      );

      if (notes) {
        event.reason = notes;
      }

      await publishWaitlistEvent(event);
    } else if (status === 'expired') {
      const event = applyPatientContext<WaitlistExpiredEvent>(
        {
          type: 'waitlist.expired',
          tenantId,
          entryId: String(entry._id),
          clinicId: entry.clinicId ? String(entry.clinicId) : null,
          doctorId: entry.doctorId ? String(entry.doctorId) : null,
          patientId: String(entry.patientId),
        },
        patientContext,
      );

      await publishWaitlistEvent(event);
    } else if (status === 'invited') {
      const event = applyPatientContext<WaitlistInvitedEvent>(
        {
          type: 'waitlist.invited',
          tenantId,
          entryId: String(entry._id),
          clinicId: entry.clinicId ? String(entry.clinicId) : null,
          doctorId: entry.doctorId ? String(entry.doctorId) : null,
          patientId: String(entry.patientId),
          respondBy: entry.expiresAt ? entry.expiresAt.toISOString() : null,
        },
        patientContext,
      );

      await publishWaitlistEvent(event);
    }
  }

  return entry;
};

export type PromoteWaitlistEntryInput = {
  tenantId: string;
  entryId: ObjectIdLike;
  appointmentId: ObjectIdLike;
  actorId?: ObjectIdLike;
  notes?: string;
};

export const markWaitlistEntryPromoted = async ({
  tenantId,
  entryId,
  appointmentId,
  actorId,
  notes,
}: PromoteWaitlistEntryInput) => {
  const id = toObjectId(entryId);
  const appointmentObjectId = toObjectId(appointmentId);

  if (!id || !appointmentObjectId) {
    throw AppError.from({
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Invalid identifiers supplied for promotion',
    });
  }

  const entry = await WaitlistModel.findOne({ _id: id, tenantId });
  if (!entry) {
    throw AppError.from({
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Waitlist entry not found',
    });
  }

  const patientContext = await getPatientContext(tenantId, entry.patientId);

  entry.status = 'promoted';
  entry.promotedAppointmentId = appointmentObjectId;
  entry.audit.push(
    createAuditEntry('promotion', actorId, notes, { appointmentId: appointmentObjectId }),
  );
  await entry.save();

  const event = applyPatientContext<WaitlistPromotedEvent>(
    {
      type: 'waitlist.promoted',
      tenantId,
      entryId: String(entry._id),
      clinicId: entry.clinicId ? String(entry.clinicId) : null,
      doctorId: entry.doctorId ? String(entry.doctorId) : null,
      patientId: String(entry.patientId),
      appointmentId: String(appointmentObjectId),
    },
    patientContext,
  );

  await publishWaitlistEvent(event);

  return entry;
};

export const expireStaleWaitlistEntries = async (tenantId: string, referenceDate = new Date()) => {
  const expiringEntries = await WaitlistModel.find({
    tenantId,
    status: { $in: ['active', 'invited'] },
    expiresAt: { $lte: referenceDate },
  }).lean();

  const ids = expiringEntries.map((entry) => entry._id);

  if (ids.length === 0) {
    return 0;
  }

  await WaitlistModel.updateMany(
    { _id: { $in: ids } },
    {
      $set: { status: 'expired' },
      $push: { audit: createAuditEntry('expiration') },
    },
  );

  await Promise.all(
    expiringEntries.map(async (entry) => {
      const patientContext = await getPatientContext(tenantId, entry.patientId as ObjectIdLike);
      const event = applyPatientContext<WaitlistExpiredEvent>(
        {
          type: 'waitlist.expired',
          tenantId,
          entryId: String(entry._id),
          clinicId: entry.clinicId ? String(entry.clinicId) : null,
          doctorId: entry.doctorId ? String(entry.doctorId) : null,
          patientId: String(entry.patientId),
        },
        patientContext,
      );

      await publishWaitlistEvent(event);
    }),
  );

  return ids.length;
};

export type UpsertWaitlistPolicyInput = {
  tenantId: string;
  clinicId?: ObjectIdLike;
  maxQueueSize?: number;
  autoExpiryHours?: number;
  autoPromoteBufferMinutes?: number;
  priorityWeights?: Record<string, number>;
  notificationTemplateOverrides?: Record<string, string>;
};

export const upsertWaitlistPolicy = async (input: UpsertWaitlistPolicyInput) => {
  const clinicId = toObjectId(input.clinicId);
  const update: Record<string, unknown> = {};

  if (input.maxQueueSize !== undefined) {
    update.maxQueueSize = input.maxQueueSize;
  }
  if (input.autoExpiryHours !== undefined) {
    update.autoExpiryHours = input.autoExpiryHours;
  }
  if (input.autoPromoteBufferMinutes !== undefined) {
    update.autoPromoteBufferMinutes = input.autoPromoteBufferMinutes;
  }
  if (input.priorityWeights !== undefined) {
    update.priorityWeights = input.priorityWeights;
  }
  if (input.notificationTemplateOverrides !== undefined) {
    update.notificationTemplateOverrides = input.notificationTemplateOverrides;
  }

  const doc = await WaitlistPolicyModel.findOneAndUpdate(
    { tenantId: input.tenantId, clinicId: clinicId ?? null },
    {
      $set: {
        ...DEFAULT_WAITLIST_POLICY,
        ...update,
        tenantId: input.tenantId,
        clinicId: clinicId ?? null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return doc;
};

export const getWaitlistPolicy = async (tenantId: string, clinicId?: ObjectIdLike) => {
  const policyDoc = await applyPolicyFallback(tenantId, toObjectId(clinicId) ?? null);
  if (policyDoc) {
    return policyDoc;
  }
  return new WaitlistPolicyModel({
    tenantId,
    clinicId: toObjectId(clinicId) ?? null,
    ...DEFAULT_WAITLIST_POLICY,
  });
};

export type BulkUpdateWaitlistStatusInput = {
  tenantId: string;
  entryIds: ObjectIdLike[];
  status: WaitlistStatus;
  actorId?: ObjectIdLike;
  notes?: string;
};

export const bulkUpdateWaitlistStatus = async ({
  tenantId,
  entryIds,
  status,
  actorId,
  notes,
}: BulkUpdateWaitlistStatusInput) => {
  const ids = entryIds
    .map((id) => toObjectId(id))
    .filter((id): id is Types.ObjectId => id !== undefined);

  if (ids.length === 0) {
    throw AppError.from({
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'No valid waitlist entry identifiers provided',
    });
  }

  const entries = await WaitlistModel.find({
    _id: { $in: ids },
    tenantId,
  });

  if (entries.length === 0) {
    throw AppError.from({
      statusCode: StatusCodes.NOT_FOUND,
      message: 'No waitlist entries found',
    });
  }

  const updateResult = await WaitlistModel.updateMany(
    { _id: { $in: ids }, tenantId },
    {
      $set: { status },
      $push: {
        audit: createAuditEntry('status-change', actorId, notes, { status, bulkUpdate: true }),
      },
    },
  );

  return {
    matched: updateResult.matchedCount,
    modified: updateResult.modifiedCount,
  };
};

export type UpdateWaitlistPriorityInput = {
  tenantId: string;
  entryId: ObjectIdLike;
  priorityScore: number;
  actorId?: ObjectIdLike;
  notes?: string;
};

export const updateWaitlistPriority = async ({
  tenantId,
  entryId,
  priorityScore,
  actorId,
  notes,
}: UpdateWaitlistPriorityInput) => {
  const id = toObjectId(entryId);
  if (!id) {
    throw AppError.from({
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Invalid waitlist entry identifier',
    });
  }

  const entry = await WaitlistModel.findOne({ _id: id, tenantId });
  if (!entry) {
    throw AppError.from({
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Waitlist entry not found',
    });
  }

  const previousPriority = entry.priorityScore;
  entry.priorityScore = priorityScore;
  entry.audit.push(
    createAuditEntry('updated', actorId, notes, {
      priorityScore: { from: previousPriority, to: priorityScore },
    }),
  );

  await entry.save();

  return entry;
};

export type WaitlistAnalyticsInput = {
  tenantId: string;
  doctorId?: ObjectIdLike;
  clinicId?: ObjectIdLike;
  startDate?: Date;
  endDate?: Date;
};

export type WaitlistAnalytics = {
  totalEntries: number;
  byStatus: Record<WaitlistStatus, number>;
  averageWaitTime: number; // in hours
  averageTimeToPromotion: number; // in hours
  promotionRate: number; // percentage
  expiryRate: number; // percentage
  cancellationRate: number; // percentage
  currentQueueSize: number;
  peakQueueSize: number;
  entriesByDay: Array<{ date: string; count: number }>;
  statusTransitions: Array<{ from: WaitlistStatus; to: WaitlistStatus; count: number }>;
};

export const getWaitlistAnalytics = async ({
  tenantId,
  doctorId,
  clinicId,
  startDate,
  endDate,
}: WaitlistAnalyticsInput): Promise<WaitlistAnalytics> => {
  const doctorIdObj = toObjectId(doctorId);
  const clinicIdObj = toObjectId(clinicId);

  const matchFilter: Record<string, unknown> = { tenantId };
  if (doctorIdObj) {
    matchFilter.doctorId = doctorIdObj;
  }
  if (clinicIdObj) {
    matchFilter.clinicId = clinicIdObj;
  }
  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {};
    if (startDate) {
      dateFilter.$gte = startDate;
    }
    if (endDate) {
      dateFilter.$lte = endDate;
    }
    matchFilter.createdAt = dateFilter;
  }

  const allEntries = await WaitlistModel.find(matchFilter).lean();

  const totalEntries = allEntries.length;

  const byStatus: Record<WaitlistStatus, number> = {
    active: 0,
    invited: 0,
    promoted: 0,
    expired: 0,
    cancelled: 0,
  };

  let totalWaitTime = 0;
  let waitTimeCount = 0;
  let totalPromotionTime = 0;
  let promotionCount = 0;

  const currentDate = new Date();
  const entriesByDayMap = new Map<string, number>();
  const statusTransitionsMap = new Map<string, number>();

  for (const entry of allEntries) {
    byStatus[entry.status] = (byStatus[entry.status] || 0) + 1;

    const createdAt = new Date(entry.createdAt);
    const isoString = createdAt.toISOString();
    const dayKey = isoString.split('T')[0];
    if (dayKey) {
      entriesByDayMap.set(dayKey, (entriesByDayMap.get(dayKey) || 0) + 1);
    }

    const entryAudit = entry.audit;
    if (entryAudit && Array.isArray(entryAudit) && entryAudit.length > 0) {
      const sortedAudit = [...entryAudit].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

      for (let i = 0; i < sortedAudit.length; i++) {
        const audit = sortedAudit[i];
        if (
          audit &&
          audit.action === 'status-change' &&
          audit.metadata &&
          typeof audit.metadata === 'object'
        ) {
          const metadata = audit.metadata as { status?: { from?: string; to?: string } };
          if (metadata.status?.from && metadata.status?.to) {
            const transitionKey = `${metadata.status.from}->${metadata.status.to}`;
            statusTransitionsMap.set(
              transitionKey,
              (statusTransitionsMap.get(transitionKey) || 0) + 1,
            );
          }
        }
      }

      const promotionAudit = sortedAudit.find((a) => a && a.action === 'promotion');
      if (promotionAudit && promotionAudit.createdAt) {
        const promotionTime = new Date(promotionAudit.createdAt).getTime() - createdAt.getTime();
        totalPromotionTime += promotionTime;
        promotionCount++;
      }
    }

    if (entry.status === 'active' || entry.status === 'invited') {
      const waitTime = currentDate.getTime() - createdAt.getTime();
      totalWaitTime += waitTime;
      waitTimeCount++;
    }
  }

  const entriesByDay = Array.from(entriesByDayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const statusTransitions = Array.from(statusTransitionsMap.entries())
    .map(([key, count]) => {
      const parts = key.split('->');
      if (parts.length === 2 && parts[0] && parts[1]) {
        return { from: parts[0] as WaitlistStatus, to: parts[1] as WaitlistStatus, count };
      }
      return null;
    })
    .filter((t): t is { from: WaitlistStatus; to: WaitlistStatus; count: number } => t !== null);

  const promoted = byStatus.promoted;
  const expired = byStatus.expired;
  const cancelled = byStatus.cancelled;
  const completed = promoted + expired + cancelled;

  const averageWaitTime = waitTimeCount > 0 ? totalWaitTime / waitTimeCount / (1000 * 60 * 60) : 0;
  const averageTimeToPromotion =
    promotionCount > 0 ? totalPromotionTime / promotionCount / (1000 * 60 * 60) : 0;
  const promotionRate = completed > 0 ? (promoted / completed) * 100 : 0;
  const expiryRate = completed > 0 ? (expired / completed) * 100 : 0;
  const cancellationRate = completed > 0 ? (cancelled / completed) * 100 : 0;

  const currentQueueSize = byStatus.active + byStatus.invited;

  const peakQueueSize = Math.max(
    ...entriesByDay.map((day) => {
      const dayDate = new Date(day.date);
      return allEntries.filter(
        (e) =>
          new Date(e.createdAt) <= dayDate &&
          (new Date(e.updatedAt || e.createdAt) >= dayDate ||
            e.status === 'active' ||
            e.status === 'invited'),
      ).length;
    }),
    currentQueueSize,
  );

  return {
    totalEntries,
    byStatus,
    averageWaitTime,
    averageTimeToPromotion,
    promotionRate,
    expiryRate,
    cancellationRate,
    currentQueueSize,
    peakQueueSize,
    entriesByDay,
    statusTransitions,
  };
};
