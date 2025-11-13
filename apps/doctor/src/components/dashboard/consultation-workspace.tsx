"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Appointment, AppointmentStatus } from "@illajwala/types";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Separator,
  Textarea,
} from "@illajwala/ui";
import { CalendarClock, ClipboardList, HeartPulse, Paperclip, Plus, Timer, TimerReset, Trash2 } from "lucide-react";

type WorkspaceProps = {
  appointment: Appointment;
  isSaving: boolean;
  onSubmit: (status: AppointmentStatus, payload: { consultation?: Appointment["consultation"] }) => Promise<void>;
  onClose: () => void;
};

type VitalDraft = {
  id: string;
  label: string;
  value: string;
  unit?: string;
};

type AttachmentDraft = {
  id: string;
  key: string;
  name: string;
  url?: string;
  contentType?: string;
  sizeInBytes?: number;
};

const toFollowUpText = (followUps?: string[]) => (followUps && followUps.length > 0 ? followUps.join("\n") : "");

const toFollowUpArray = (value: string) =>
  value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);

const formatDuration = (milliseconds: number) => {
  if (milliseconds <= 0) {
    return "00:00";
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

const mapVitals = (appointment: Appointment): VitalDraft[] =>
  (appointment.consultation?.vitals ?? []).map((entry, index) => ({
    id: `${entry.label}-${index}`,
    label: entry.label,
    value: entry.value,
    unit: entry.unit,
  }));

const mapAttachments = (appointment: Appointment): AttachmentDraft[] =>
  (appointment.consultation?.attachments ?? []).map((attachment, index) => ({
    id: attachment.key ?? `${attachment.name}-${index}`,
    key: attachment.key ?? `${attachment.name}-${index}`,
    name: attachment.name,
    url: attachment.url,
    contentType: attachment.contentType,
    sizeInBytes: attachment.sizeInBytes,
  }));

export const ConsultationWorkspace = ({ appointment, isSaving, onSubmit, onClose }: WorkspaceProps) => {
  const startedAtIso = appointment.consultation?.startedAt ?? appointment.scheduledAt;
  const [notes, setNotes] = useState<string>(appointment.consultation?.notes ?? "");
  const [followUps, setFollowUps] = useState<string>(toFollowUpText(appointment.consultation?.followUpActions));
  const [vitals, setVitals] = useState<VitalDraft[]>(() => mapVitals(appointment));
  const [attachments, setAttachments] = useState<AttachmentDraft[]>(() => mapAttachments(appointment));
  const [elapsed, setElapsed] = useState(() => {
    const started = startedAtIso ? new Date(startedAtIso).getTime() : null;
    return started ? formatDuration(Date.now() - started) : "00:00";
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setNotes(appointment.consultation?.notes ?? "");
    setFollowUps(toFollowUpText(appointment.consultation?.followUpActions));
    setVitals(mapVitals(appointment));
    setAttachments(mapAttachments(appointment));
  }, [appointment]);

  useEffect(() => {
    if (!startedAtIso) {
      setElapsed("00:00");
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
    setVitals((current) => [...current, { id, label: "", value: "", unit: "" }]);
  };

  const handleUpdateVital = (id: string, field: keyof Omit<VitalDraft, "id">, value: string) => {
    setVitals((current) =>
      current.map((vital) => (vital.id === id ? { ...vital, [field]: value } : vital))
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
      fileInputRef.current.value = "";
    }
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
    [attachments, followUps, notes, vitals]
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
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }, [appointment.scheduledAt]);

  const statusBadge = useMemo(() => {
    switch (appointment.status) {
      case "in-session":
        return { label: "In session", tone: "secondary" as const };
      case "checked-in":
        return { label: "Checked in", tone: "outline" as const };
      case "completed":
        return { label: "Completed", tone: "default" as const };
      case "no-show":
        return { label: "No show", tone: "destructive" as const };
      default:
        return { label: "Pending", tone: "outline" as const };
    }
  }, [appointment.status]);

  const isActiveSession = appointment.status === "in-session";
  const canStartSession = appointment.status === "checked-in";

  return (
    <>
      <DialogHeader className="space-y-2">
        <DialogTitle className="flex flex-wrap items-center gap-3 text-lg font-semibold">
          Consultation workspace
          <Badge variant={statusBadge.tone} className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]">
            {statusBadge.label}
          </Badge>
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          Track the live consultation, log vitals, and attach visit artefacts. Changes auto-save when you click Save.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 space-y-6">
        <Alert className="rounded-2xl border border-primary/40 bg-primary/5 text-sm text-primary">
          <AlertTitle className="flex items-center gap-2 text-sm font-semibold">
            <Timer className="h-4 w-4" />
            Session timer
          </AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-primary shadow-sm">
              <CalendarClock className="h-4 w-4" />
              {scheduleLabel}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-primary shadow-sm">
              <TimerReset className="h-4 w-4" />
              {elapsed}
            </span>
          </AlertDescription>
        </Alert>

        <section className="space-y-4 rounded-2xl border border-border bg-muted/20 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              <ClipboardList className="h-4 w-4" />
              Consultation notes
            </span>
            <div className="flex items-center gap-2">
              {canStartSession ? (
                <Button
                  size="sm"
                  className="rounded-full px-4 text-xs"
                  disabled={isSaving}
                  onClick={() => void handleSave("in-session")}
                >
                  Begin session
                </Button>
              ) : null}
              {isActiveSession ? (
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]">
                  Live
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="workspace-notes">Visit summary</Label>
              <Textarea
                id="workspace-notes"
                rows={5}
                placeholder="Document key observations, next steps, and medication changes..."
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workspace-followups">Follow-up actions (one per line)</Label>
              <Textarea
                id="workspace-followups"
                rows={3}
                placeholder={"Book follow-up visit in 2 weeks\nComplete lab tests before next visit"}
                value={followUps}
                onChange={(event) => setFollowUps(event.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-background/60 p-5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              <HeartPulse className="h-4 w-4" />
              Vitals
            </span>
            <Button size="sm" variant="outline" className="rounded-full px-3 text-xs" onClick={handleAddVital}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add vital
            </Button>
          </div>
          {vitals.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
              Log important readings captured during the consultation. These surface in the patient&apos;s summary.
            </p>
          ) : (
            <div className="space-y-3">
              {vitals.map((vital) => (
                <div
                  key={vital.id}
                  className="grid gap-3 rounded-xl border border-border/60 bg-background/80 p-4 sm:grid-cols-[auto_auto_auto_auto]"
                >
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Label</Label>
                    <Input
                      value={vital.label}
                      placeholder="Blood pressure"
                      onChange={(event) => handleUpdateVital(vital.id, "label", event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Value</Label>
                    <Input
                      value={vital.value}
                      placeholder="120/80"
                      onChange={(event) => handleUpdateVital(vital.id, "value", event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Unit</Label>
                    <Input
                      value={vital.unit ?? ""}
                      placeholder="mmHg"
                      onChange={(event) => handleUpdateVital(vital.id, "unit", event.target.value)}
                    />
                  </div>
                  <div className="flex items-end justify-end">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRemoveVital(vital.id)}
                      aria-label="Remove vital"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-background/60 p-5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              <Paperclip className="h-4 w-4" />
              Attachments
            </span>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(event) => handleAttachmentsSelected(event.target.files)}
              />
              <Button
                size="sm"
                variant="outline"
                className="rounded-full px-3 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add files
              </Button>
            </div>
          </div>
          {attachments.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
              Upload lab orders, prescriptions, or consent forms. S3 uploads are stubbed in development; metadata is stored for QA.
            </p>
          ) : (
            <div className="space-y-3">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-background/80 p-4"
                >
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-foreground">{attachment.name}</p>
                    <p className="text-xs text-muted-foreground/80">
                      {attachment.contentType ?? "application/octet-stream"}
                      {attachment.sizeInBytes ? ` · ${(attachment.sizeInBytes / 1024).toFixed(1)} KB` : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    aria-label="Remove attachment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
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
            disabled={isSaving || appointment.status === "completed"}
            onClick={() => void handleSave("completed")}
          >
            Complete visit
          </Button>
        </div>
      </DialogFooter>
    </>
  );
};


