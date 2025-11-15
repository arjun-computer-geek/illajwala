import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import { AppointmentModel } from './appointment.model';
import type {
  CreateAppointmentInput,
  UpdateAppointmentStatusInput,
  ConfirmAppointmentPaymentInput,
  UpdateAppointmentPaymentInput,
} from './appointment.schema';
import type { AuthenticatedRequest } from '../../utils';
import { AppError } from '../../utils';
import { acquireSlotLock, releaseSlotLock } from './slot-lock.service';
import type { AppointmentDocument } from './appointment.model';

// TODO: These will be replaced with HTTP calls to provider-service and payment-service
// For now, we'll create a simplified version that can be enhanced later
const APPOINTMENT_PAYMENT_TIMEOUT_MINUTES = 15;

type Requester = AuthenticatedRequest['user'];

export const createAppointment = async (
  payload: CreateAppointmentInput,
  requester: Requester | undefined,
  tenantId: string,
): Promise<{
  appointment: AppointmentDocument;
  paymentOrder: null | {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    receipt?: string;
    intentExpiresAt?: Date;
  };
}> => {
  if (!tenantId) {
    throw AppError.from({
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Tenant context is required to create appointments',
    });
  }

  if (requester?.role === 'patient' && requester.id !== payload.patientId) {
    throw AppError.from({
      statusCode: StatusCodes.FORBIDDEN,
      message: 'You can only book appointments for your own profile',
    });
  }

  const scheduledAt = new Date(payload.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    throw AppError.from({
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Invalid scheduled date',
    });
  }

  if (scheduledAt.getTime() <= Date.now()) {
    throw AppError.from({
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Cannot book slots in the past',
    });
  }

  // TODO: Fetch doctor from provider-service via HTTP
  // For now, we'll skip validation and create the appointment
  // const doctor = await fetchDoctorFromProviderService(payload.doctorId, tenantId);

  // TODO: Fetch patient from identity-service or provider-service via HTTP
  // const patientExists = await fetchPatientFromService(payload.patientId, tenantId);

  const clinicId =
    (payload.clinicId && Types.ObjectId.isValid(payload.clinicId)
      ? new Types.ObjectId(payload.clinicId)
      : null) ?? null;

  const expiresInSeconds = APPOINTMENT_PAYMENT_TIMEOUT_MINUTES * 60;
  const lockAcquired = await acquireSlotLock(
    tenantId,
    payload.doctorId,
    scheduledAt,
    expiresInSeconds,
    clinicId,
  );

  if (!lockAcquired) {
    throw AppError.from({
      statusCode: StatusCodes.CONFLICT,
      message: 'Selected slot is no longer available. Please choose a different time.',
    });
  }

  try {
    const conflictingAppointment = await AppointmentModel.findOne({
      tenantId,
      doctor: payload.doctorId,
      scheduledAt,
      status: { $ne: 'cancelled' },
    });

    if (conflictingAppointment) {
      throw AppError.from({
        statusCode: StatusCodes.CONFLICT,
        message: 'Another appointment already exists for this slot.',
      });
    }

    // TODO: Create payment order via payment-service HTTP call
    // For now, create appointment without payment
    const status: AppointmentDocument['status'] = 'confirmed';
    const paymentData: AppointmentDocument['payment'] | undefined = undefined;
    const paymentPayload = null;

    const appointment = await AppointmentModel.create({
      tenantId,
      patient: payload.patientId,
      doctor: payload.doctorId,
      clinic: clinicId ?? undefined,
      scheduledAt,
      mode: payload.mode,
      reasonForVisit: payload.reasonForVisit,
      status,
      payment: paymentData,
    });

    await appointment.populate([
      { path: 'patient', select: 'name email phone' },
      {
        path: 'doctor',
        select: 'name specialization consultationModes fee clinicLocations',
      },
      { path: 'clinic', select: 'name slug timezone' },
    ]);

    return {
      appointment,
      paymentOrder: paymentPayload,
    };
  } finally {
    await releaseSlotLock(tenantId, payload.doctorId, scheduledAt, clinicId);
  }
};

export const listAppointments = async ({
  page = 1,
  pageSize = 20,
  patientId,
  doctorId,
  status,
  requester,
  tenantId,
}: {
  page?: number;
  pageSize?: number;
  patientId?: string;
  doctorId?: string;
  status?: string;
  requester?: Requester;
  tenantId: string;
}) => {
  const filter: Record<string, unknown> = { tenantId };
  if (patientId) {
    filter.patient = patientId;
  }
  if (doctorId) {
    filter.doctor = doctorId;
  }
  if (status) {
    filter.status = status;
  }
  if (requester?.role === 'patient') {
    filter.patient = requester.id;
  }
  if (requester?.role === 'doctor') {
    filter.doctor = requester.id;
  }

  const [items, total] = await Promise.all([
    AppointmentModel.find(filter)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization consultationModes fee clinicLocations')
      .sort({ scheduledAt: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    AppointmentModel.countDocuments(filter),
  ]);

  return { items, total };
};

export const getAppointmentById = async (id: string, tenantId: string) => {
  const appointment = await AppointmentModel.findOne({ _id: id, tenantId })
    .populate('patient', 'name email phone')
    .populate('doctor', 'name specialization consultationModes fee clinicLocations')
    .populate('clinic', 'name slug timezone')
    .lean();

  if (!appointment) {
    throw AppError.from({
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Appointment not found',
    });
  }

  return appointment;
};

export const cancelAppointment = async (
  id: string,
  reason: string | undefined,
  requester: Requester | undefined,
  tenantId: string,
) => {
  const appointment = await AppointmentModel.findOne({ _id: id, tenantId });

  if (!appointment) {
    throw AppError.from({
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Appointment not found',
    });
  }

  // Check permissions
  if (requester?.role === 'patient' && appointment.patient.toString() !== requester.id) {
    throw AppError.from({
      statusCode: StatusCodes.FORBIDDEN,
      message: 'You can only cancel your own appointments',
    });
  }

  if (requester?.role === 'doctor' && appointment.doctor.toString() !== requester.id) {
    throw AppError.from({
      statusCode: StatusCodes.FORBIDDEN,
      message: 'You can only cancel your own appointments',
    });
  }

  // Don't allow canceling already cancelled or completed appointments
  if (appointment.status === 'cancelled') {
    throw AppError.from({
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Appointment is already cancelled',
    });
  }

  if (appointment.status === 'completed') {
    throw AppError.from({
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Cannot cancel a completed appointment',
    });
  }

  appointment.status = 'cancelled';
  if (reason) {
    appointment.notes = [appointment.notes, `Cancellation reason: ${reason}`]
      .filter(Boolean)
      .join('\n');
  }

  await appointment.save();
  await appointment.populate([
    { path: 'patient', select: 'name email phone' },
    { path: 'doctor', select: 'name specialization consultationModes fee clinicLocations' },
    { path: 'clinic', select: 'name slug timezone' },
  ]);

  return appointment;
};

export const updateAppointmentStatus = async (
  id: string,
  payload: UpdateAppointmentStatusInput,
  requester: Requester | undefined,
  tenantId: string,
) => {
  if (requester?.role === 'patient') {
    throw AppError.from({
      statusCode: StatusCodes.FORBIDDEN,
      message: 'Patients cannot modify appointment status',
    });
  }

  const appointment = await AppointmentModel.findOne({ _id: id, tenantId });

  if (!appointment) {
    throw AppError.from({
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Appointment not found',
    });
  }

  const previousStatus = appointment.status;

  if (payload.notes !== undefined) {
    appointment.notes = payload.notes;
  }

  const ensureConsultation = () => {
    if (!appointment.consultation) {
      appointment.consultation = {};
    }
    return appointment.consultation;
  };

  if (payload.consultation) {
    const consultation = ensureConsultation();

    if (payload.consultation.startedAt) {
      consultation.startedAt = payload.consultation.startedAt;
    }
    if (payload.consultation.endedAt) {
      consultation.endedAt = payload.consultation.endedAt;
    }
    if (payload.consultation.notes !== undefined) {
      consultation.notes = payload.consultation.notes;
    }
    if (payload.consultation.followUpActions) {
      consultation.followUpActions = payload.consultation.followUpActions;
    }
    if (payload.consultation.vitals) {
      consultation.vitals = payload.consultation.vitals.map((entry) => ({
        label: entry.label,
        value: entry.value,
        ...(entry.unit !== undefined ? { unit: entry.unit } : {}),
      }));
    }
    if (payload.consultation.attachments) {
      consultation.attachments = payload.consultation.attachments.map((attachment) => ({
        key: attachment.key,
        name: attachment.name,
        ...(attachment.url !== undefined ? { url: attachment.url } : {}),
        ...(attachment.contentType !== undefined ? { contentType: attachment.contentType } : {}),
        ...(attachment.sizeInBytes !== undefined ? { sizeInBytes: attachment.sizeInBytes } : {}),
      }));
    }
    if (payload.consultation.prescriptions) {
      consultation.prescriptions = payload.consultation.prescriptions.map((prescription) => ({
        medication: prescription.medication,
        dosage: prescription.dosage,
        frequency: prescription.frequency,
        ...(prescription.duration !== undefined ? { duration: prescription.duration } : {}),
        ...(prescription.instructions !== undefined
          ? { instructions: prescription.instructions }
          : {}),
        ...(prescription.refills !== undefined ? { refills: prescription.refills } : {}),
      }));
    }
    if (payload.consultation.referrals) {
      consultation.referrals = payload.consultation.referrals.map((referral) => ({
        type: referral.type,
        reason: referral.reason,
        ...(referral.specialty !== undefined ? { specialty: referral.specialty } : {}),
        ...(referral.provider !== undefined ? { provider: referral.provider } : {}),
        ...(referral.priority !== undefined ? { priority: referral.priority } : {}),
        ...(referral.notes !== undefined ? { notes: referral.notes } : {}),
      }));
    }
    if (payload.consultation.followUps) {
      consultation.followUps = payload.consultation.followUps.map((followUp) => ({
        action: followUp.action,
        ...(followUp.scheduledAt !== undefined ? { scheduledAt: followUp.scheduledAt } : {}),
        ...(followUp.priority !== undefined ? { priority: followUp.priority } : {}),
        ...(followUp.completed !== undefined ? { completed: followUp.completed } : {}),
      }));
    }
  }

  const now = new Date();
  if (payload.status === 'checked-in' || payload.status === 'in-session') {
    const consultation = ensureConsultation();
    if (!consultation.startedAt) {
      consultation.startedAt = now;
    }
  }
  if (payload.status === 'completed') {
    const consultation = ensureConsultation();
    if (!consultation.startedAt) {
      consultation.startedAt = appointment.consultation?.startedAt ?? appointment.scheduledAt;
    }
    if (!consultation.endedAt) {
      consultation.endedAt = now;
    }
  }
  if (payload.status === 'no-show') {
    const consultation = ensureConsultation();
    if (!consultation.endedAt) {
      consultation.endedAt = now;
    }
  }

  appointment.status = payload.status;

  if (requester?.id && appointment.consultation) {
    const isValidObjectId = Types.ObjectId.isValid(requester.id);
    if (isValidObjectId) {
      appointment.consultation.lastEditedBy = new Types.ObjectId(requester.id);
    }
  }

  await appointment.save();
  await appointment.populate([
    { path: 'patient', select: 'name email phone' },
    { path: 'doctor', select: 'name specialization consultationModes fee clinicLocations' },
  ]);

  // TODO: Publish consultation event via event bus
  // await publishConsultationEvent({ appointment, previousStatus });

  return appointment;
};

export const confirmAppointmentPayment = async (
  id: string,
  payload: ConfirmAppointmentPaymentInput,
  requester: Requester | undefined,
  tenantId: string,
) => {
  const appointment = await AppointmentModel.findOne({ _id: id, tenantId });

  if (!appointment) {
    throw AppError.from({
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Appointment not found',
    });
  }

  if (requester?.role === 'patient' && appointment.patient.toString() !== requester.id) {
    throw AppError.from({
      statusCode: StatusCodes.FORBIDDEN,
      message: 'You can only confirm payments for your own appointments',
    });
  }

  if (!appointment.payment) {
    throw AppError.from({
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'This appointment does not require a payment',
    });
  }

  if (appointment.payment.orderId !== payload.orderId) {
    throw AppError.from({
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Order mismatch for this appointment',
    });
  }

  if (appointment.payment.status === 'captured' && appointment.status === 'confirmed') {
    await appointment.populate([
      { path: 'patient', select: 'name email phone' },
      { path: 'doctor', select: 'name specialization consultationModes fee clinicLocations' },
    ]);
    return appointment;
  }

  // TODO: Verify payment signature via payment-service HTTP call
  // const isValidSignature = await verifyPaymentViaPaymentService(payload);

  const now = new Date();

  appointment.payment.status = 'captured';
  appointment.payment.paymentId = payload.paymentId;
  appointment.payment.signature = payload.signature;
  appointment.payment.capturedAt = now;
  appointment.payment.history = [
    ...(appointment.payment.history ?? []),
    {
      type: 'payment-captured',
      payload,
      createdAt: now,
    },
  ];

  appointment.status = 'confirmed';

  await appointment.save();
  await appointment.populate([
    { path: 'patient', select: 'name email phone' },
    { path: 'doctor', select: 'name specialization consultationModes fee clinicLocations' },
  ]);

  return appointment;
};

export const updateAppointmentPayment = async (
  id: string,
  payload: UpdateAppointmentPaymentInput,
  requester: Requester | undefined,
  tenantId: string,
) => {
  if (requester?.role !== 'admin') {
    throw AppError.from({
      statusCode: StatusCodes.FORBIDDEN,
      message: 'Only admins can override payment status',
    });
  }

  const appointment = await AppointmentModel.findOne({ _id: id, tenantId });

  if (!appointment || !appointment.payment) {
    throw AppError.from({
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Appointment payment not found',
    });
  }

  const now = new Date();

  appointment.payment.status = payload.status;
  if (payload.paymentId) {
    appointment.payment.paymentId = payload.paymentId;
  }

  if (payload.status === 'captured') {
    appointment.payment.capturedAt = now;
    appointment.status = 'confirmed';
  } else if (payload.status === 'failed') {
    appointment.payment.failedAt = now;
    if (payload.notes) {
      appointment.notes = [appointment.notes, payload.notes].filter(Boolean).join('\n');
    }
  }

  appointment.payment.history = [
    ...(appointment.payment.history ?? []),
    {
      type: 'manual-update',
      payload: {
        status: payload.status,
        paymentId: payload.paymentId,
        notes: payload.notes,
        actor: requester.id,
      },
      createdAt: now,
    },
  ];

  await appointment.save();
  await appointment.populate([
    { path: 'patient', select: 'name email phone' },
    { path: 'doctor', select: 'name specialization consultationModes fee clinicLocations' },
  ]);

  return appointment;
};
