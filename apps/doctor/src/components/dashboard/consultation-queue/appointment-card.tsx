'use client';

import { Badge, Button } from '@illajwala/ui';
import type { Appointment } from '@illajwala/types';
import { CalendarClock, Clock3, FileText, MapPin, Video } from 'lucide-react';

type AppointmentCardProps = {
  appointment: Appointment;
  isProcessing: boolean;
  onCheckIn: () => void;
  onStartConsultation: () => void;
  onComplete: () => void;
  onUpdateNotes: () => void;
  onOpenWorkspace: () => void;
  onMarkNoShow: () => void;
  statusBadgeVariant: Partial<
    Record<Appointment['status'], 'default' | 'secondary' | 'outline' | 'destructive'>
  >;
  statusCopy: Record<Appointment['status'], string>;
  formatTimeRange: (scheduledAt: string) => string;
};

export const AppointmentCard = ({
  appointment,
  isProcessing,
  onCheckIn,
  onStartConsultation,
  onComplete,
  onUpdateNotes,
  onOpenWorkspace,
  onMarkNoShow,
  statusBadgeVariant,
  statusCopy,
  formatTimeRange,
}: AppointmentCardProps) => {
  const specialist = appointment.doctor.specialization;
  const modeIcon =
    appointment.mode === 'telehealth' ? (
      <Video className="h-3.5 w-3.5" />
    ) : (
      <MapPin className="h-3.5 w-3.5" />
    );
  const modeLabel = appointment.mode === 'telehealth' ? 'Telehealth' : 'In-clinic';
  const showCheckIn = appointment.status === 'confirmed';
  const showStart = appointment.status === 'checked-in';
  const showComplete = appointment.status === 'in-session';
  const showUpdateNotes = appointment.status === 'completed';

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-background/50 p-5 transition duration-200 hover:border-primary/40 hover:bg-background/80 md:flex-row md:items-center md:justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-base font-semibold text-foreground">
            {appointment.patient?.name ?? 'Unnamed patient'}
          </h3>
          <Badge
            variant="outline"
            className="rounded-full border-border/40 bg-muted/40 px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
          >
            {specialist}
          </Badge>
          <Badge
            variant={statusBadgeVariant[appointment.status] ?? 'outline'}
            className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
          >
            {statusCopy[appointment.status]}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground/90">
          <span className="inline-flex items-center gap-2 rounded-full bg-muted/30 px-3 py-1">
            <Clock3 className="h-3.5 w-3.5 text-primary" />
            {formatTimeRange(appointment.scheduledAt)}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-muted/30 px-3 py-1">
            {modeIcon}
            {modeLabel}
          </span>
          {appointment.reasonForVisit && (
            <span className="inline-flex items-center gap-2 rounded-full bg-muted/30 px-3 py-1">
              <FileText className="h-3.5 w-3.5 text-primary" />
              {appointment.reasonForVisit}
            </span>
          )}
          {appointment.consultation?.startedAt && (
            <span className="inline-flex items-center gap-2 rounded-full bg-muted/30 px-3 py-1">
              <CalendarClock className="h-3.5 w-3.5 text-primary" />
              {new Intl.DateTimeFormat(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(appointment.consultation.startedAt))}
            </span>
          )}
        </div>
        {appointment.consultation?.followUpActions &&
          appointment.consultation.followUpActions.length > 0 && (
            <div className="rounded-xl border border-dashed border-border/50 bg-muted/20 p-3 text-xs text-muted-foreground/90">
              <p className="font-medium text-foreground">Follow-ups</p>
              <ul className="mt-1 space-y-1">
                {appointment.consultation.followUpActions.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          )}
      </div>

      <div className="flex flex-col gap-3 md:w-56">
        {showCheckIn ? (
          <Button
            variant="secondary"
            className="rounded-full px-4 text-xs"
            onClick={onCheckIn}
            disabled={isProcessing}
          >
            Mark checked in
          </Button>
        ) : null}
        {showStart ? (
          <Button
            variant="secondary"
            className="rounded-full px-4 text-xs"
            onClick={onStartConsultation}
            disabled={isProcessing}
          >
            Start consultation
          </Button>
        ) : null}
        {showComplete ? (
          <Button
            variant="secondary"
            className="rounded-full px-4 text-xs"
            onClick={onComplete}
            disabled={isProcessing}
          >
            Complete visit
          </Button>
        ) : null}
        {(appointment.status === 'checked-in' || appointment.status === 'in-session') && (
          <Button
            variant="outline"
            className="rounded-full px-4 text-xs"
            onClick={onOpenWorkspace}
            disabled={isProcessing}
          >
            Open workspace
          </Button>
        )}
        {showUpdateNotes ? (
          <Button
            variant="outline"
            className="rounded-full px-4 text-xs"
            onClick={onUpdateNotes}
            disabled={isProcessing}
          >
            Update visit summary
          </Button>
        ) : null}
        <Button
          variant="ghost"
          className="rounded-full px-4 text-xs text-destructive"
          onClick={onMarkNoShow}
          disabled={isProcessing || appointment.status === 'no-show'}
        >
          Mark no-show
        </Button>
      </div>
    </div>
  );
};
