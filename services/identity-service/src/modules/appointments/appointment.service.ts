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
import { DoctorModel } from '../doctors/doctor.model';
import { acquireSlotLock, releaseSlotLock } from './slot-lock.service';
import { env } from '../../config/env';
import {
  createOrder,
  verifyPaymentSignature,
  type RazorpayOrderResponse,
} from '../payments/razorpay.client';
import type { AppointmentDocument } from './appointment.model';
import { publishConsultationEvent } from '../events/consultation-events.publisher';
import type { ConsultationEventType } from '@illajwala/types';
import { PatientModel, defaultNotificationPreferences } from '../patients/patient.model';

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

  const doctor = await DoctorModel.findOne({ _id: payload.doctorId, tenantId }).select(
    'fee consultationModes name specialization primaryClinicId clinicIds',
  );
  if (!doctor) {
    throw AppError.from({
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Doctor not found',
    });
  }

  const patientExists = await PatientModel.exists({ _id: payload.patientId, tenantId });
  if (!patientExists) {
    throw AppError.from({
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Patient not found',
    });
  }

  if (!doctor.consultationModes.includes(payload.mode)) {
    throw AppError.from({
      statusCode: StatusCodes.BAD_REQUEST,
      message: `Doctor is not available for ${payload.mode} consultations`,
    });
  }

  // Resolve clinicId early for slot locking
  const clinicId =
    (payload.clinicId && Types.ObjectId.isValid(payload.clinicId)
      ? new Types.ObjectId(payload.clinicId)
      : null) ??
    doctor.primaryClinicId ??
    null;

  const expiresInSeconds = env.APPOINTMENT_PAYMENT_TIMEOUT_MINUTES * 60;
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

    const amountInRupees = typeof doctor.fee === 'number' && doctor.fee > 0 ? doctor.fee : 0;
    const amountInMinorUnits = Math.round(amountInRupees * 100);
    const requiresPayment = amountInMinorUnits > 0;

    let paymentPayload: null | {
      orderId: string;
      amount: number;
      currency: string;
      keyId: string;
      receipt?: string;
      intentExpiresAt?: Date;
    } = null;

    let paymentData: AppointmentDocument['payment'] | undefined;
    const status: AppointmentDocument['status'] = requiresPayment ? 'pending-payment' : 'confirmed';

    if (requiresPayment) {
      const receipt = `appt_${payload.patientId}_${Date.now()}`;
      const order: RazorpayOrderResponse = await createOrder({
        amount: amountInMinorUnits,
        currency: env.RAZORPAY_CURRENCY,
        receipt,
        notes: {
          doctorId: String(payload.doctorId),
          patientId: String(payload.patientId),
          scheduledAt: scheduledAt.toISOString(),
        },
      });

      const intentExpiresAt = new Date(Date.now() + expiresInSeconds * 1000);
      paymentData = {
        orderId: order.id,
        status: 'pending',
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt ?? receipt,
        history: [
          {
            type: 'order-created',
            payload: order,
            createdAt: new Date(),
          },
        ],
        intentExpiresAt,
      };

      paymentPayload = {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: env.RAZORPAY_KEY_ID,
        receipt: order.receipt ?? receipt,
        intentExpiresAt,
      };
    }

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
      { path: 'patient', select: 'name email phone primaryClinicId' },
      {
        path: 'doctor',
        select:
          'name specialization consultationModes fee clinicLocations primaryClinicId clinicIds',
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
    // Merge consultation payload field-by-field so callers are not forced to
    // send the entire object when editing notes or vitals.
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
  }

  const now = new Date();
  if (payload.status === 'checked-in' || payload.status === 'in-session') {
    const consultation = ensureConsultation();
    // Starting or resuming a session marks the start timestamp when absent so
    // we can display elapsed time in the doctor workspace.
    if (!consultation.startedAt) {
      consultation.startedAt = now;
    }
  }
  if (payload.status === 'completed') {
    const consultation = ensureConsultation();
    // Completion ensures both `startedAt` and `endedAt` are set to avoid null
    // comparisons on the frontend timeline.
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
      // Track the latest editor responsible for consultation updates so we can
      // audit changes in the admin console later.
      appointment.consultation.lastEditedBy = new Types.ObjectId(requester.id);
    }
  }

  await appointment.save();
  await appointment.populate([
    { path: 'patient', select: 'name email phone' },
    { path: 'doctor', select: 'name specialization consultationModes fee clinicLocations' },
  ]);

  await maybePublishConsultationEvent({
    appointment,
    previousStatus,
  });

  return appointment;
};

const statusToEventMap: Partial<Record<AppointmentDocument['status'], ConsultationEventType>> = {
  'checked-in': 'consultation.checked-in',
  'in-session': 'consultation.in-session',
  completed: 'consultation.completed',
  'no-show': 'consultation.no-show',
};

const maybePublishConsultationEvent = async ({
  appointment,
  previousStatus,
}: {
  appointment: AppointmentDocument;
  previousStatus: AppointmentDocument['status'];
}) => {
  const eventType = statusToEventMap[appointment.status];
  if (!eventType || previousStatus === appointment.status) {
    return;
  }

  const doctor = appointment.doctor as unknown as { _id: string; name?: string };
  const patient = appointment.patient as unknown as {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  const patientId = patient?._id?.toString() ?? String(appointment.patient);

  const patientRecord = await PatientModel.findOne({
    _id: patientId,
    tenantId: appointment.tenantId,
  })
    .select('phone notificationPreferences')
    .lean();

  const patientPhone = patient?.phone ?? patientRecord?.phone ?? undefined;
  const notificationPreferences =
    patientRecord?.notificationPreferences ?? defaultNotificationPreferences;

  const payload = {
    type: eventType,
    appointmentId: String(appointment._id),
    doctorId: doctor?._id?.toString() ?? String(appointment.doctor),
    patientId: patient?._id?.toString() ?? String(appointment.patient),
    scheduledAt: appointment.scheduledAt.toISOString(),
    tenantId: appointment.tenantId,
    ...(doctor?.name ? { doctorName: doctor.name } : {}),
    ...(patient?.name ? { patientName: patient.name } : {}),
    ...(patient?.email ? { patientEmail: patient.email } : {}),
    ...(patientPhone ? { patientPhone } : {}),
    notificationPreferences,
  };

  const metadata =
    appointment.consultation &&
    (appointment.consultation.followUpActions || appointment.consultation.notes)
      ? {
          followUpActions: appointment.consultation.followUpActions,
          notes: appointment.consultation.notes,
        }
      : undefined;

  await publishConsultationEvent({
    ...payload,
    ...(metadata ? { metadata } : {}),
  });
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

  const isValidSignature = verifyPaymentSignature({
    orderId: payload.orderId,
    paymentId: payload.paymentId,
    signature: payload.signature,
  });

  if (!isValidSignature) {
    throw AppError.from({
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Invalid payment signature',
    });
  }

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
