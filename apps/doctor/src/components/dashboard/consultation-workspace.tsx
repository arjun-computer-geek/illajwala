'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
import {
  formatDuration,
  toFollowUpText,
  toFollowUpArray,
  mapVitals,
  mapAttachments,
  type VitalDraft,
  type AttachmentDraft,
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
  const [elapsed, setElapsed] = useState(() => {
    const started = startedAtIso ? new Date(startedAtIso).getTime() : null;
    return started ? formatDuration(Date.now() - started) : '00:00';
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setNotes(appointment.consultation?.notes ?? '');
    setFollowUps(toFollowUpText(appointment.consultation?.followUpActions));
    setVitals(mapVitals(appointment));
    setAttachments(mapAttachments(appointment));
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

  const handleAddVital = () => {
    const id = `vital-${Date.now()}`;
    setVitals((current) => [...current, { id, label: '', value: '', unit: '' }]);
  };

  const handleUpdateVital = (id: string, field: keyof Omit<VitalDraft, 'id'>, value: string) => {
    setVitals((current) =>
      current.map((vital) => (vital.id === id ? { ...vital, [field]: value } : vital)),
    );
  };

  const handleRemoveVital = (id: string) => {
    setVitals((current) => current.filter((vital) => vital.id !== id));
  };

  const handleAttachmentsSelected = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const nextAttachments: AttachmentDraft[] = Array.from(files).map((file) => ({
      id: `upload-${Date.now()}-${file.name}`,
      key: `upload-${Date.now()}-${file.name}`,
      name: file.name,
      contentType: file.type || undefined,
      sizeInBytes: file.size || undefined,
    }));

    setAttachments((current) => [...current, ...nextAttachments]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((current) => current.filter((attachment) => attachment.id !== id));
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
    }),
    [attachments, followUps, notes, vitals],
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
          onAdd={handleFileInputClick}
          onRemove={handleRemoveAttachment}
          fileInputRef={fileInputRef}
          onFileSelect={handleAttachmentsSelected}
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
