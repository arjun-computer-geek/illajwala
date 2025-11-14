'use client';

import React, { useState } from 'react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import {
  CalendarDays,
  Clock,
  Video,
  MapPin,
  Timer,
  Star,
  HeartPulse,
  Paperclip,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Appointment, AppointmentFeedbackPayload } from '@/types/api';
import { useCountdown } from './use-countdown';
import { deriveTelehealthLink, type ExtendedAppointment } from './utils';

type AppointmentCardProps = {
  appointment: ExtendedAppointment;
  onSubmitFeedback: (payload: AppointmentFeedbackPayload) => void;
  submittingFeedback: boolean;
};

const statusVariantMap: Record<
  Appointment['status'],
  'secondary' | 'default' | 'outline' | 'destructive'
> = {
  'pending-payment': 'outline',
  confirmed: 'secondary',
  'checked-in': 'secondary',
  'in-session': 'secondary',
  completed: 'default',
  cancelled: 'destructive',
  'no-show': 'destructive',
};

const formatStatus = (status: Appointment['status']) => {
  switch (status) {
    case 'pending-payment':
      return 'Pending payment';
    case 'checked-in':
      return 'Checked in';
    case 'in-session':
      return 'In session';
    case 'no-show':
      return 'No show';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

const ratingOptions = [1, 2, 3, 4, 5] as const;

export const AppointmentCard = React.memo(
  ({ appointment, onSubmitFeedback, submittingFeedback }: AppointmentCardProps) => {
    const isTelehealth = appointment.mode === 'telehealth';
    const formattedDate = format(new Date(appointment.scheduledAt), 'EEE, dd MMM yyyy');
    const formattedTime = format(new Date(appointment.scheduledAt), 'hh:mm a');
    const consultation = appointment.consultation;
    const countdownLabel = useCountdown(appointment.scheduledAt, appointment.status);
    const joinUrl = deriveTelehealthLink(appointment);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [selectedRating, setSelectedRating] = useState<number | null>(null);
    const [feedbackNotes, setFeedbackNotes] = useState('');
    const hasFeedback = Boolean(appointment.feedback?.rating);

    const showJoinButton =
      appointment.status === 'confirmed' ||
      appointment.status === 'checked-in' ||
      appointment.status === 'in-session';

    return (
      <>
        <div className="flex flex-col gap-5 rounded-3xl bg-white/95 p-6 shadow-xl shadow-primary/10 transition duration-200 hover:-translate-y-1 hover:shadow-brand-card dark:bg-card/90 dark:shadow-[0_30px_65px_-30px_rgba(2,6,23,0.85)] dark:ring-1 dark:ring-primary/20 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-semibold text-foreground">{appointment.doctor.name}</h3>
              <Badge
                variant="secondary"
                className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
              >
                {appointment.doctor.specialization}
              </Badge>
              <Badge
                variant={statusVariantMap[appointment.status] ?? 'outline'}
                className="rounded-full px-3 py-1 text-xs font-semibold"
              >
                {formatStatus(appointment.status)}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2 rounded-full bg-muted/40 px-3 py-1">
                <CalendarDays className="h-4 w-4 text-primary" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-2 rounded-full bg-muted/40 px-3 py-1">
                <Clock className="h-4 w-4 text-primary" />
                {formattedTime}
              </span>
              <span className="flex items-center gap-2 rounded-full bg-muted/40 px-3 py-1">
                {isTelehealth ? (
                  <Video className="h-4 w-4 text-primary" />
                ) : (
                  <MapPin className="h-4 w-4 text-primary" />
                )}
                {isTelehealth
                  ? 'Telehealth'
                  : (appointment.doctor.clinicLocations?.[0]?.name ?? 'Clinic visit')}
              </span>
              {countdownLabel && (
                <span className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-primary">
                  <Timer className="h-4 w-4" />
                  {countdownLabel}
                </span>
              )}
            </div>
            {appointment.reasonForVisit && (
              <p className="text-sm text-muted-foreground">Reason: {appointment.reasonForVisit}</p>
            )}
            {appointment.payment && (
              <p className="text-xs text-muted-foreground/80">
                Payment status:{' '}
                <span className="font-medium text-foreground">{appointment.payment.status}</span>
                {appointment.payment.receipt ? ` • Receipt ${appointment.payment.receipt}` : ''}
              </p>
            )}
            {consultation?.followUpActions && consultation.followUpActions.length > 0 && (
              <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
                  Next steps
                </p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground/90">
                  {consultation.followUpActions.map((action) => (
                    <li key={action}>• {action}</li>
                  ))}
                </ul>
              </div>
            )}
            {consultation?.vitals && consultation.vitals.length > 0 ? (
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground/90">
                <p className="flex items-center gap-2 font-medium text-foreground">
                  <HeartPulse className="h-3.5 w-3.5 text-primary" />
                  Vitals
                </p>
                <ul className="mt-2 space-y-1">
                  {consultation.vitals.map((entry) => (
                    <li key={`${entry.label}-${entry.value}`}>
                      {entry.label}:{' '}
                      <span className="font-medium text-foreground">{entry.value}</span>
                      {entry.unit ? ` ${entry.unit}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {consultation?.attachments && consultation.attachments.length > 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground/90">
                <p className="flex items-center gap-2 font-medium text-foreground">
                  <Paperclip className="h-3.5 w-3.5 text-primary" />
                  Attachments
                </p>
                <ul className="mt-2 space-y-1">
                  {consultation.attachments.map((attachment) => (
                    <li key={attachment.key}>
                      {attachment.url ? (
                        <a
                          className="text-primary underline"
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {attachment.name}
                        </a>
                      ) : (
                        <span>{attachment.name}</span>
                      )}
                      {attachment.sizeInBytes
                        ? ` · ${(attachment.sizeInBytes / 1024).toFixed(1)} KB`
                        : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {consultation?.notes && appointment.status === 'completed' && (
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground/90">
                <p className="font-medium text-foreground">Visit summary</p>
                <p className="mt-1 whitespace-pre-wrap">{consultation.notes}</p>
              </div>
            )}
            {appointment.feedback?.rating && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
                >
                  <Star className="h-3 w-3" />
                  {appointment.feedback.rating.toFixed(1)}
                </Badge>
                {appointment.feedback.comments ? (
                  <span>{appointment.feedback.comments}</span>
                ) : null}
                {appointment.feedback.submittedAt ? (
                  <span className="text-muted-foreground/60">
                    •{' '}
                    {formatDistanceToNowStrict(new Date(appointment.feedback.submittedAt), {
                      addSuffix: true,
                    })}
                  </span>
                ) : null}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <Button variant="outline" className="rounded-full px-6" disabled>
              Reschedule
            </Button>
            {appointment.status === 'pending-payment' ? (
              <Button variant="secondary" className="rounded-full px-6" disabled>
                Complete payment (coming soon)
              </Button>
            ) : showJoinButton ? (
              joinUrl ? (
                <Button asChild variant="secondary" className="rounded-full px-6">
                  <a href={joinUrl} target="_blank" rel="noreferrer">
                    Join telehealth
                  </a>
                </Button>
              ) : (
                <Button variant="secondary" className="rounded-full px-6" disabled>
                  Join telehealth (link soon)
                </Button>
              )
            ) : (
              <Button variant="secondary" className="rounded-full px-6" disabled>
                Cancel
              </Button>
            )}
            {appointment.status === 'completed' && !hasFeedback ? (
              <Button
                variant="outline"
                className="rounded-full px-6"
                onClick={() => {
                  setSelectedRating(appointment.feedback?.rating ?? null);
                  setFeedbackNotes(appointment.feedback?.comments ?? '');
                  setIsFeedbackOpen(true);
                }}
              >
                Share feedback
              </Button>
            ) : null}
          </div>
        </div>

        <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share your feedback</DialogTitle>
              <DialogDescription>
                Help us improve by rating your experience with {appointment.doctor.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Rating</Label>
                <div className="flex gap-2">
                  {ratingOptions.map((rating) => (
                    <Button
                      key={rating}
                      type="button"
                      variant={selectedRating === rating ? 'default' : 'outline'}
                      size="icon"
                      className="rounded-full"
                      onClick={() => setSelectedRating(rating)}
                    >
                      <Star
                        className={`h-5 w-5 ${selectedRating && selectedRating >= rating ? 'fill-yellow-400 text-yellow-400' : ''}`}
                      />
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback-comments">Comments (optional)</Label>
                <Textarea
                  id="feedback-comments"
                  placeholder="Share your experience..."
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setIsFeedbackOpen(false)}
                disabled={submittingFeedback}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!selectedRating) {
                    toast.error('Please select a rating before submitting.');
                    return;
                  }
                  onSubmitFeedback({
                    rating: selectedRating,
                    comments: feedbackNotes.trim() || undefined,
                  });
                  setIsFeedbackOpen(false);
                }}
                disabled={submittingFeedback}
              >
                Submit feedback
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  },
);

AppointmentCard.displayName = 'AppointmentCard';
