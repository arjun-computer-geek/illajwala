import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import {
  WaitlistModel,
  WaitlistPolicyModel,
  type WaitlistEntryDocument,
  type WaitlistPolicyDocument,
  type WaitlistStatus,
} from './waitlist.model';
import { AppError } from '../../utils';

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

  // TODO: Fetch patient context from provider-service or identity-service via HTTP
  // const patientContext = await getPatientContext(tenantId, patientId);

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

  // TODO: Publish waitlist event via event bus
  // await publishWaitlistEvent({ type: 'waitlist.joined', ... });

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
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .populate('clinic', 'name slug')
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    WaitlistModel.countDocuments(filter),
  ]);

  return { items, total };
};

export const getWaitlistEntryById = async (tenantId: string, id: ObjectIdLike, lean = false) => {
  const entryId = toObjectId(id);
  if (!entryId) {
    return null;
  }
  const query = WaitlistModel.findOne({ _id: entryId, tenantId });
  return lean ? query.lean() : query;
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

  // TODO: Publish waitlist event via event bus
  // await publishWaitlistEvent({ type: 'waitlist.status.changed', ... });

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

  entry.status = 'promoted';
  entry.promotedAppointmentId = appointmentObjectId;
  entry.audit.push(
    createAuditEntry('promotion', actorId, notes, { appointmentId: String(appointmentObjectId) }),
  );

  if (notes) {
    entry.notes = notes;
  }

  await entry.save();

  // TODO: Publish waitlist event via event bus
  // await publishWaitlistEvent({ type: 'waitlist.promoted', ... });

  return entry;
};

export const upsertWaitlistPolicy = async (
  tenantId: string,
  input: {
    clinicId?: ObjectIdLike;
    maxQueueSize?: number;
    autoExpiryHours?: number;
    autoPromoteBufferMinutes?: number;
    priorityWeights?: Record<string, number>;
    notificationTemplateOverrides?: Record<string, string>;
  },
) => {
  const clinicId = toObjectId(input.clinicId) ?? null;

  const policy = await WaitlistPolicyModel.findOneAndUpdate(
    { tenantId, clinicId },
    {
      ...(input.maxQueueSize !== undefined ? { maxQueueSize: input.maxQueueSize } : {}),
      ...(input.autoExpiryHours !== undefined ? { autoExpiryHours: input.autoExpiryHours } : {}),
      ...(input.autoPromoteBufferMinutes !== undefined
        ? { autoPromoteBufferMinutes: input.autoPromoteBufferMinutes }
        : {}),
      ...(input.priorityWeights !== undefined ? { priorityWeights: input.priorityWeights } : {}),
      ...(input.notificationTemplateOverrides !== undefined
        ? { notificationTemplateOverrides: input.notificationTemplateOverrides }
        : {}),
    },
    { upsert: true, new: true, runValidators: true },
  );

  return policy;
};

export const getWaitlistPolicy = async (tenantId: string, clinicId?: ObjectIdLike) => {
  const normalizedClinicId = toObjectId(clinicId) ?? null;
  const policy = await WaitlistPolicyModel.findOne({ tenantId, clinicId: normalizedClinicId });
  return policy;
};

export const bulkUpdateWaitlistStatus = async (
  tenantId: string,
  entryIds: ObjectIdLike[],
  status: WaitlistStatus,
  actorId?: ObjectIdLike,
  notes?: string,
) => {
  const ids = entryIds.map(toObjectId).filter((id): id is Types.ObjectId => id !== undefined);

  if (ids.length === 0) {
    throw AppError.from({
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'No valid entry identifiers provided',
    });
  }

  const entries = await WaitlistModel.find({ _id: { $in: ids }, tenantId });

  if (entries.length !== ids.length) {
    throw AppError.from({
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Some waitlist entries were not found',
    });
  }

  const auditEntry = createAuditEntry('status-change', actorId, notes, { status, bulk: true });

  for (const entry of entries) {
    if (entry.status !== status) {
      entry.status = status;
      entry.audit.push(auditEntry);
      if (notes && status !== 'cancelled') {
        entry.notes = notes;
      }
    }
  }

  await Promise.all(entries.map((entry) => entry.save()));

  return entries;
};

export const updateWaitlistPriority = async (
  tenantId: string,
  entryId: ObjectIdLike,
  priorityScore: number,
  actorId?: ObjectIdLike,
  notes?: string,
) => {
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

  entry.priorityScore = priorityScore;
  entry.audit.push(createAuditEntry('updated', actorId, notes, { priorityScore }));

  if (notes) {
    entry.notes = notes;
  }

  await entry.save();

  return entry;
};

export const getWaitlistAnalytics = async (tenantId: string, clinicId?: ObjectIdLike) => {
  const normalizedClinicId = toObjectId(clinicId) ?? null;
  const filter: Record<string, unknown> = { tenantId };
  if (normalizedClinicId) {
    filter.clinicId = normalizedClinicId;
  }

  const [total, active, invited, promoted, expired, cancelled] = await Promise.all([
    WaitlistModel.countDocuments(filter),
    WaitlistModel.countDocuments({ ...filter, status: 'active' }),
    WaitlistModel.countDocuments({ ...filter, status: 'invited' }),
    WaitlistModel.countDocuments({ ...filter, status: 'promoted' }),
    WaitlistModel.countDocuments({ ...filter, status: 'expired' }),
    WaitlistModel.countDocuments({ ...filter, status: 'cancelled' }),
  ]);

  return {
    total,
    byStatus: {
      active,
      invited,
      promoted,
      expired,
      cancelled,
    },
  };
};
