'use strict';

// TODO: Replace with inter-service communication
import { DoctorModel } from '../../models/doctor.model';
import { AppointmentModel } from '../../models/appointment.model';
import { ClinicModel } from '../../models/clinic.model';
import type { SLAMetrics } from '@illajwala/types';

const VERIFICATION_SLA_TARGET_HOURS = 48;
const INCIDENT_RESOLUTION_TARGET_HOURS = 4;
const PAYOUT_PROCESSING_TARGET_HOURS = 48;
const CLINIC_ACTIVATION_TARGET_DAYS = 7;

const calculatePercentage = (value: number, target: number): number => {
  if (target === 0) return 100;
  return Math.min(100, Math.round((target / value) * 100));
};

export const getSLAMetrics = async (tenantId: string): Promise<SLAMetrics> => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Verification SLA: Time from doctor creation to approval/active status
  const doctorsForVerification = await DoctorModel.find({
    tenantId,
    createdAt: { $gte: thirtyDaysAgo },
    $or: [{ reviewStatus: 'approved' }, { reviewStatus: 'active' }],
  })
    .select('createdAt approvedAt lastReviewedAt reviewStatus')
    .lean();

  let totalVerificationTime = 0;
  let verificationCount = 0;

  for (const doctor of doctorsForVerification) {
    const createdAt = new Date(doctor.createdAt);
    const approvedAt = doctor.approvedAt
      ? new Date(doctor.approvedAt)
      : doctor.lastReviewedAt
        ? new Date(doctor.lastReviewedAt)
        : null;

    if (approvedAt) {
      const hours = (approvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      totalVerificationTime += hours;
      verificationCount++;
    }
  }

  const avgVerificationHours =
    verificationCount > 0
      ? totalVerificationTime / verificationCount
      : VERIFICATION_SLA_TARGET_HOURS;
  const verificationMet = calculatePercentage(avgVerificationHours, VERIFICATION_SLA_TARGET_HOURS);

  // Incident Resolution: Time from appointment no-show to resolution
  // For now, we'll use appointment cancellations as a proxy for incidents
  const incidents = await AppointmentModel.find({
    tenantId,
    status: { $in: ['cancelled', 'no-show'] },
    createdAt: { $gte: thirtyDaysAgo },
  })
    .select('createdAt updatedAt status')
    .lean();

  let totalResolutionTime = 0;
  let resolutionCount = 0;

  for (const incident of incidents) {
    const createdAt = new Date(incident.createdAt);
    const updatedAt = new Date(incident.updatedAt || incident.createdAt);
    const hours = (updatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    totalResolutionTime += hours;
    resolutionCount++;
  }

  const avgResolutionHours =
    resolutionCount > 0 ? totalResolutionTime / resolutionCount : INCIDENT_RESOLUTION_TARGET_HOURS;
  const resolutionMet = calculatePercentage(avgResolutionHours, INCIDENT_RESOLUTION_TARGET_HOURS);

  // Payout Processing: Time from payment capture to payout (simplified - using payment capture to completion)
  const payments = await AppointmentModel.find({
    tenantId,
    'payment.status': 'captured',
    'payment.capturedAt': { $gte: thirtyDaysAgo },
    status: 'completed',
  })
    .select('payment.capturedAt consultation.endedAt')
    .lean();

  let totalPayoutTime = 0;
  let payoutCount = 0;

  for (const payment of payments) {
    if (payment.payment?.capturedAt && payment.consultation?.endedAt) {
      const capturedAt = new Date(payment.payment.capturedAt);
      const endedAt = new Date(payment.consultation.endedAt);
      const hours = (endedAt.getTime() - capturedAt.getTime()) / (1000 * 60 * 60);
      totalPayoutTime += hours;
      payoutCount++;
    }
  }

  const avgPayoutHours =
    payoutCount > 0 ? totalPayoutTime / payoutCount : PAYOUT_PROCESSING_TARGET_HOURS;
  const payoutMet = calculatePercentage(avgPayoutHours, PAYOUT_PROCESSING_TARGET_HOURS);

  // Clinic Activation: Time from clinic creation to first active doctor
  const clinics = await ClinicModel.find({
    tenantId,
    createdAt: { $gte: thirtyDaysAgo },
  })
    .select('createdAt _id')
    .lean();

  let totalActivationTime = 0;
  let activationCount = 0;

  for (const clinic of clinics) {
    const clinicCreatedAt = new Date(clinic.createdAt);
    const firstActiveDoctor = await DoctorModel.findOne({
      tenantId,
      $or: [{ primaryClinicId: clinic._id }, { clinicIds: clinic._id }],
      reviewStatus: 'active',
    })
      .select('approvedAt')
      .sort({ approvedAt: 1 })
      .lean();

    if (firstActiveDoctor?.approvedAt) {
      const approvedAt = new Date(firstActiveDoctor.approvedAt);
      const days = (approvedAt.getTime() - clinicCreatedAt.getTime()) / (1000 * 60 * 60 * 24);
      totalActivationTime += days;
      activationCount++;
    }
  }

  const avgActivationDays =
    activationCount > 0 ? totalActivationTime / activationCount : CLINIC_ACTIVATION_TARGET_DAYS;
  const activationMet = calculatePercentage(avgActivationDays, CLINIC_ACTIVATION_TARGET_DAYS);

  return {
    verificationSLA: {
      average: Math.round(avgVerificationHours * 10) / 10,
      target: VERIFICATION_SLA_TARGET_HOURS,
      met: Math.round(verificationMet * 10) / 10,
    },
    incidentResolution: {
      average: Math.round(avgResolutionHours * 10) / 10,
      target: INCIDENT_RESOLUTION_TARGET_HOURS,
      met: Math.round(resolutionMet * 10) / 10,
    },
    payoutProcessing: {
      average: Math.round(avgPayoutHours * 10) / 10,
      target: PAYOUT_PROCESSING_TARGET_HOURS,
      met: Math.round(payoutMet * 10) / 10,
    },
    clinicActivation: {
      average: Math.round(avgActivationDays * 10) / 10,
      target: CLINIC_ACTIVATION_TARGET_DAYS,
      met: Math.round(activationMet * 10) / 10,
    },
  };
};
