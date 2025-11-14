'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Appointment, AppointmentStatus } from '@illajwala/types';
import {
  Badge,
  Button,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Separator,
} from '@illajwala/ui';
import { SessionTimer } from './consultation-workspace/session-timer';
import { NotesSection } from './consultation-workspace/notes-section';
import { VitalsSection } from './consultation-workspace/vitals-section';
import { AttachmentsSection } from './consultation-workspace/attachments-section';
import { PrescriptionsSection } from './consultation-workspace/prescriptions-section';
import { ReferralsSection } from './consultation-workspace/referrals-section';
import {
  formatDuration,
  toFollowUpText,
  toFollowUpArray,
  mapVitals,
  mapAttachments,
  mapPrescriptions,
  mapReferrals,
  type VitalDraft,
  type AttachmentDraft,
  type PrescriptionDraft,
  type ReferralDraft,
} from './consultation-workspace/utils';

type WorkspaceProps = {
  appointment: Appointment;
  isSaving: boolean;
  onSubmit: (
    status: AppointmentStatus,
    payload: { consultation?: Appointment['consultation'] },
  ) => Promise<void>;
  onClose: () => void;
};

export const ConsultationWorkspace = ({
  appointment,
  isSaving,
  onSubmit,
  onClose,
}: WorkspaceProps) => {
  const startedAtIso = appointment.consultation?.startedAt ?? appointment.scheduledAt;
  const [notes, setNotes] = useState<string>(appointment.consultation?.notes ?? '');
  const [followUps, setFollowUps] = useState<string>(
    toFollowUpText(appointment.consultation?.followUpActions),
  );
  const [vitals, setVitals] = useState<VitalDraft[]>(() => mapVitals(appointment));
  const [attachments, setAttachments] = useState<AttachmentDraft[]>(() =>
    mapAttachments(appointment),
  );
  const [prescriptions, setPrescriptions] = useState<PrescriptionDraft[]>(() =>
    mapPrescriptions(appointment),
  );
  const [referrals, setReferrals] = useState<ReferralDraft[]>(() => mapReferrals(appointment));
  const [elapsed, setElapsed] = useState(() => {
    const started = startedAtIso ? new Date(startedAtIso).getTime() : null;
    return started ? formatDuration(Date.now() - started) : '00:00';
  });

  useEffect(() => {
    setNotes(appointment.consultation?.notes ?? '');
    setFollowUps(toFollowUpText(appointment.consultation?.followUpActions));
    setVitals(mapVitals(appointment));
    setAttachments(mapAttachments(appointment));
    setPrescriptions(mapPrescriptions(appointment));
    setReferrals(mapReferrals(appointment));
  }, [appointment]);

  useEffect(() => {
    if (!startedAtIso) {
      setElapsed('00:00');
      return;
    }

    const startedAt = new Date(startedAtIso).getTime();
    if (Number.isNaN(startedAt)) {
      return;
    }

    const updateElapsed = () => {
      setElapsed(formatDuration(Date.now() - startedAt));
    };

    updateElapsed();
    const interval = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(interval);
  }, [startedAtIso]);

  const handleAddVital = (vital?: Partial<Omit<VitalDraft, 'id'>>) => {
    const id = `vital-${Date.now()}-${Math.random()}`;
    setVitals((current) => [
      ...current,
      { id, label: vital?.label ?? '', value: vital?.value ?? '', unit: vital?.unit ?? '' },
    ]);
  };

  const handleUpdateVital = (id: string, field: keyof Omit<VitalDraft, 'id'>, value: string) => {
    setVitals((current) =>
      current.map((vital) => (vital.id === id ? { ...vital, [field]: value } : vital)),
    );
  };

  const handleRemoveVital = (id: string) => {
    setVitals((current) => current.filter((vital) => vital.id !== id));
  };

  const handleAttachmentsChange = (newAttachments: AttachmentDraft[]) => {
    setAttachments(newAttachments);
  };

  const handleAddPrescription = () => {
    const id = `prescription-${Date.now()}-${Math.random()}`;
    setPrescriptions((current) => [...current, { id, medication: '', dosage: '', frequency: '' }]);
  };

  const handleUpdatePrescription = (
    id: string,
    field: keyof Omit<PrescriptionDraft, 'id'>,
    value: string | number | undefined,
  ) => {
    setPrescriptions((current) =>
      current.map((prescription) =>
        prescription.id === id ? { ...prescription, [field]: value } : prescription,
      ),
    );
  };

  const handleRemovePrescription = (id: string) => {
    setPrescriptions((current) => current.filter((prescription) => prescription.id !== id));
  };

  const handleAddReferral = () => {
    const id = `referral-${Date.now()}-${Math.random()}`;
    setReferrals((current) => [
      ...current,
      { id, type: 'specialist', reason: '', priority: 'routine' },
    ]);
  };

  const handleUpdateReferral = (
    id: string,
    field: keyof Omit<ReferralDraft, 'id'>,
    value: string | undefined,
  ) => {
    setReferrals((current) =>
      current.map((referral) => (referral.id === id ? { ...referral, [field]: value } : referral)),
    );
  };

  const handleRemoveReferral = (id: string) => {
    setReferrals((current) => current.filter((referral) => referral.id !== id));
  };

  const consultationPayload = useMemo(
    () => ({
      notes: notes.trim() ? notes.trim() : undefined,
      followUpActions: toFollowUpArray(followUps),
      vitals: vitals
        .filter((entry) => entry.label.trim() && entry.value.trim())
        .map((entry) => ({
          label: entry.label.trim(),
          value: entry.value.trim(),
          ...(entry.unit?.trim() ? { unit: entry.unit.trim() } : {}),
        })),
      attachments:
        attachments.length === 0
          ? undefined
          : attachments.map((attachment) => ({
              key: attachment.key,
              name: attachment.name,
              ...(attachment.url ? { url: attachment.url } : {}),
              ...(attachment.contentType ? { contentType: attachment.contentType } : {}),
              ...(attachment.sizeInBytes ? { sizeInBytes: attachment.sizeInBytes } : {}),
            })),
      prescriptions:
        prescriptions.length === 0
          ? undefined
          : prescriptions
              .filter((p) => p.medication.trim() && p.dosage.trim() && p.frequency.trim())
              .map((prescription) => ({
                medication: prescription.medication.trim(),
                dosage: prescription.dosage.trim(),
                frequency: prescription.frequency.trim(),
                ...(prescription.duration?.trim()
                  ? { duration: prescription.duration.trim() }
                  : {}),
                ...(prescription.instructions?.trim()
                  ? { instructions: prescription.instructions.trim() }
                  : {}),
                ...(prescription.refills !== undefined ? { refills: prescription.refills } : {}),
              })),
      referrals:
        referrals.length === 0
          ? undefined
          : referrals
              .filter((r) => r.reason.trim())
              .map((referral) => ({
                type: referral.type,
                reason: referral.reason.trim(),
                ...(referral.specialty?.trim() ? { specialty: referral.specialty.trim() } : {}),
                ...(referral.provider?.trim() ? { provider: referral.provider.trim() } : {}),
                ...(referral.priority ? { priority: referral.priority } : {}),
                ...(referral.notes?.trim() ? { notes: referral.notes.trim() } : {}),
              })),
    }),
    [attachments, followUps, notes, vitals, prescriptions, referrals],
  );

  const handleSave = async (status: AppointmentStatus) => {
    await onSubmit(status, {
      consultation: {
        ...consultationPayload,
        notes: consultationPayload.notes,
        followUpActions:
          consultationPayload.followUpActions && consultationPayload.followUpActions.length > 0
            ? consultationPayload.followUpActions
            : undefined,
      },
    });
  };

  const scheduleLabel = useMemo(() => {
    const date = new Date(appointment.scheduledAt);
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }, [appointment.scheduledAt]);

  const statusBadge = useMemo(() => {
    switch (appointment.status) {
      case 'in-session':
        return { label: 'In session', tone: 'secondary' as const };
      case 'checked-in':
        return { label: 'Checked in', tone: 'outline' as const };
      case 'completed':
        return { label: 'Completed', tone: 'default' as const };
      case 'no-show':
        return { label: 'No show', tone: 'destructive' as const };
      default:
        return { label: 'Pending', tone: 'outline' as const };
    }
  }, [appointment.status]);

  const isActiveSession = appointment.status === 'in-session';
  const canStartSession = appointment.status === 'checked-in';

  return (
    <>
      <DialogHeader className="space-y-2">
        <DialogTitle className="flex flex-wrap items-center gap-3 text-lg font-semibold">
          Consultation workspace
          <Badge
            variant={statusBadge.tone}
            className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
          >
            {statusBadge.label}
          </Badge>
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          Track the live consultation, log vitals, and attach visit artefacts. Changes auto-save
          when you click Save.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 space-y-6">
        <SessionTimer scheduleLabel={scheduleLabel} elapsed={elapsed} />

        <NotesSection
          appointment={appointment}
          notes={notes}
          followUps={followUps}
          onNotesChange={setNotes}
          onFollowUpsChange={setFollowUps}
          onStartSession={() => void handleSave('in-session')}
          canStartSession={canStartSession}
          isActiveSession={isActiveSession}
          isSaving={isSaving}
        />

        <VitalsSection
          vitals={vitals}
          onAdd={handleAddVital}
          onUpdate={handleUpdateVital}
          onRemove={handleRemoveVital}
        />

        <AttachmentsSection
          attachments={attachments}
          onAttachmentsChange={handleAttachmentsChange}
          appointmentId={appointment._id}
        />

        <PrescriptionsSection
          prescriptions={prescriptions}
          onAdd={handleAddPrescription}
          onUpdate={handleUpdatePrescription}
          onRemove={handleRemovePrescription}
        />

        <ReferralsSection
          referrals={referrals}
          onAdd={handleAddReferral}
          onUpdate={handleUpdateReferral}
          onRemove={handleRemoveReferral}
        />
      </div>

      <Separator className="my-6" />

      <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
          Close
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="rounded-full px-6"
            disabled={isSaving}
            onClick={() => void handleSave(appointment.status)}
          >
            Save notes
          </Button>
          <Button
            type="button"
            className="rounded-full px-6"
            disabled={isSaving || appointment.status === 'completed'}
            onClick={() => void handleSave('completed')}
          >
            Complete visit
          </Button>
        </div>
      </DialogFooter>
    </>
  );
};
