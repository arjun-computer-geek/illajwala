import type { Appointment } from '@illajwala/types';

export type VitalDraft = {
  id: string;
  label: string;
  value: string;
  unit?: string;
};

export type AttachmentDraft = {
  id: string;
  key: string;
  name: string;
  url?: string;
  contentType?: string;
  sizeInBytes?: number;
};

export type PrescriptionDraft = {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
  refills?: number;
};

export type ReferralDraft = {
  id: string;
  type: 'specialist' | 'lab' | 'imaging' | 'therapy' | 'other';
  specialty?: string;
  provider?: string;
  reason: string;
  priority?: 'routine' | 'urgent' | 'emergency';
  notes?: string;
};

export const formatDuration = (milliseconds: number) => {
  if (milliseconds <= 0) {
    return '00:00';
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const toFollowUpText = (followUps?: string[]) =>
  followUps && followUps.length > 0 ? followUps.join('\n') : '';

export const toFollowUpArray = (value: string) =>
  value
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean);

export const mapVitals = (appointment: Appointment): VitalDraft[] =>
  (appointment.consultation?.vitals ?? []).map((entry, index) => ({
    id: `${entry.label}-${index}`,
    label: entry.label,
    value: entry.value,
    unit: entry.unit,
  }));

export const mapAttachments = (appointment: Appointment): AttachmentDraft[] =>
  (appointment.consultation?.attachments ?? []).map((attachment, index) => ({
    id: attachment.key ?? `${attachment.name}-${index}`,
    key: attachment.key ?? `${attachment.name}-${index}`,
    name: attachment.name,
    url: attachment.url,
    contentType: attachment.contentType,
    sizeInBytes: attachment.sizeInBytes,
  }));

export const mapPrescriptions = (appointment: Appointment): PrescriptionDraft[] =>
  (appointment.consultation?.prescriptions ?? []).map((prescription, index) => ({
    id: `prescription-${index}-${prescription.medication}`,
    medication: prescription.medication,
    dosage: prescription.dosage,
    frequency: prescription.frequency,
    duration: prescription.duration,
    instructions: prescription.instructions,
    refills: prescription.refills,
  }));

export const mapReferrals = (appointment: Appointment): ReferralDraft[] =>
  (appointment.consultation?.referrals ?? []).map((referral, index) => ({
    id: `referral-${index}-${referral.type}`,
    type: referral.type,
    specialty: referral.specialty,
    provider: referral.provider,
    reason: referral.reason,
    priority: referral.priority,
    notes: referral.notes,
  }));
