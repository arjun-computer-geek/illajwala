"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNowStrict } from "date-fns";
import { CalendarDays, Clock, Video, MapPin, CircleAlert, Timer, Wifi, WifiOff, Star, HeartPulse, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { appointmentsApi } from "@/lib/api/appointments";
import { queryKeys } from "@/lib/query-keys";
import type { Appointment, AppointmentFeedbackPayload } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import {
  type AppointmentRealtimeEvent,
  useAppointmentRealtime,
} from "@/lib/realtime/appointments";

// Map backend statuses to badge variants. New consultation states added in Sprint 3
// default to outline until we introduce richer styling.
const statusVariantMap: Record<Appointment["status"], "secondary" | "default" | "outline" | "destructive"> = {
  "pending-payment": "outline",
  confirmed: "secondary",
  "checked-in": "secondary",
  "in-session": "secondary",
  completed: "default",
  cancelled: "destructive",
  "no-show": "destructive",
};

const formatStatus = (status: Appointment["status"]) => {
  switch (status) {
    case "pending-payment":
      return "Pending payment";
    case "checked-in":
      return "Checked in";
    case "in-session":
      return "In session";
    case "no-show":
      return "No show";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

type ExtendedAppointment = Appointment & {
  feedback?: {
    rating?: number;
    comments?: string;
    submittedAt?: string;
  };
  telehealth?: {
    joinUrl?: string;
    url?: string;
    startUrl?: string;
    passcode?: string;
  };
};

const countdownEligibleStatuses: Appointment["status"][] = ["pending-payment", "confirmed", "checked-in"];

const sortAppointmentsBySchedule = (appointments: ExtendedAppointment[]) =>
  [...appointments].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

const upsertAppointment = (appointments: ExtendedAppointment[], incoming: ExtendedAppointment) => {
  const next = appointments.filter((appointment) => appointment._id !== incoming._id);
  next.push(incoming);
  return sortAppointmentsBySchedule(next);
};

const removeAppointment = (appointments: ExtendedAppointment[], appointmentId: string) =>
  appointments.filter((appointment) => appointment._id !== appointmentId);

const deriveTelehealthLink = (appointment: ExtendedAppointment) =>
  appointment.telehealth?.joinUrl ?? appointment.telehealth?.url ?? appointment.telehealth?.startUrl ?? null;

const computeCountdownLabel = (scheduledAt: string, status: Appointment["status"]) => {
  if (!countdownEligibleStatuses.includes(status)) {
    return null;
  }

  const target = new Date(scheduledAt).getTime();
  const difference = target - Date.now();

  // Past the window: no countdown shown once the visit is 45 minutes in the past.
  if (difference <= -45 * 60 * 1000) {
    return null;
  }

  if (difference <= 0) {
    return "Starting now";
  }

  const seconds = Math.floor(difference / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds.toString().padStart(2, "0")}s`;
  }

  return `${remainingSeconds}s`;
};

const useCountdown = (scheduledAt: string, status: Appointment["status"]) => {
  const [label, setLabel] = useState<string | null>(() => computeCountdownLabel(scheduledAt, status));

  useEffect(() => {
    setLabel(computeCountdownLabel(scheduledAt, status));

    if (!countdownEligibleStatuses.includes(status)) {
      return;
    }

    const interval = window.setInterval(() => {
      setLabel(computeCountdownLabel(scheduledAt, status));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [scheduledAt, status]);

  return label;
};

const ratingOptions = [1, 2, 3, 4, 5] as const;

export const AppointmentsList = () => {
  const { isAuthenticated, hydrated, token } = useAuth();
  const queryClient = useQueryClient();
  const [liveAppointments, setLiveAppointments] = useState<ExtendedAppointment[] | null>(null);
  const lastRealtimeErrorAtRef = useRef<number>(0);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.appointments(),
    queryFn: async () => appointmentsApi.list({ page: 1, pageSize: 10 }),
    enabled: hydrated && isAuthenticated,
    staleTime: 60_000,
  });

  // Keep memo to avoid re-render loops when the query refetches in the background.
  const appointments: ExtendedAppointment[] = useMemo(
    () => (data?.data ?? []) as ExtendedAppointment[],
    [data]
  );

  useEffect(() => {
    if (appointments) {
      setLiveAppointments(sortAppointmentsBySchedule(appointments));
    }
  }, [appointments]);

  const updateAppointmentsState = useCallback(
    (updater: (items: ExtendedAppointment[]) => ExtendedAppointment[]) => {
      setLiveAppointments((current) => {
        const source = current ?? [];
        const next = updater(source);
        return sortAppointmentsBySchedule(next);
      });
      queryClient.setQueryData(queryKeys.appointments(), (previous: any) => {
        if (!previous) {
          return previous;
        }
        const nextData = updater((previous.data ?? []) as ExtendedAppointment[]);
        return {
          ...previous,
          data: sortAppointmentsBySchedule(nextData),
        };
      });
    },
    [queryClient]
  );

  const handleRealtimeEvent = useCallback(
    (event: AppointmentRealtimeEvent) => {
      if (event.type === "heartbeat") {
        return;
      }

      if ("appointment" in event && event.appointment) {
        updateAppointmentsState((items) => upsertAppointment(items, event.appointment as ExtendedAppointment));
        return;
      }

      if ("appointmentId" in event && event.appointmentId) {
        updateAppointmentsState((items) => removeAppointment(items, event.appointmentId));
        return;
      }
    },
    [updateAppointmentsState]
  );

  const handleRealtimeError = useCallback(() => {
    const now = Date.now();
    if (now - lastRealtimeErrorAtRef.current > 60_000) {
      lastRealtimeErrorAtRef.current = now;
      toast.error("Live appointment updates interrupted", {
        description: "We’re reconnecting in the background. You can refresh to force an update.",
      });
    }
    void refetch();
  }, [refetch]);

  const connectionState = useAppointmentRealtime({
    token: token ?? null,
    enabled: hydrated && isAuthenticated && Boolean(token),
    onEvent: handleRealtimeEvent,
    onError: handleRealtimeError,
  });

  if (!hydrated) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-3xl" />
        ))}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-3xl bg-muted/40 p-10 text-center shadow-[0_20px_46px_-30px_rgba(15,23,42,0.55)] dark:bg-card/80 dark:text-muted-foreground/90 dark:shadow-[0_28px_62px_-30px_rgba(2,6,23,0.85)] dark:ring-1 dark:ring-primary/20">
        <h3 className="text-lg font-semibold text-foreground">Sign in to manage your visits</h3>
        <p className="mt-3 text-sm text-muted-foreground">
          Track confirmations, join telehealth calls, and reschedule with just a tap.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="outline" className="rounded-full px-6">
            <Link href="/auth/patient/login">Sign in</Link>
          </Button>
          <Button asChild className="rounded-full px-6">
            <Link href="/auth/patient/register">Create account</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-3xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-4 rounded-3xl bg-destructive/5 p-6 text-sm text-muted-foreground shadow-[0_20px_48px_-28px_rgba(220,38,38,0.45)] md:flex-row md:items-center md:justify-between dark:bg-destructive/10 dark:text-muted-foreground/90 dark:shadow-[0_26px_58px_-30px_rgba(248,113,113,0.35)] dark:ring-1 dark:ring-destructive/40">
        <div className="flex items-center gap-3">
          <CircleAlert className="h-5 w-5 text-destructive" />
          <span>We couldn&apos;t load your appointments. Please refresh the page or try again later.</span>
        </div>
        <Button variant="secondary" size="sm" className="rounded-full" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const displayAppointments = liveAppointments ?? appointments;

  if (displayAppointments.length === 0) {
    return (
      <div className="rounded-3xl bg-white/95 p-10 text-center shadow-xl shadow-primary/10 dark:bg-card/90 dark:shadow-[0_30px_65px_-30px_rgba(2,6,23,0.85)] dark:ring-1 dark:ring-primary/20">
        <h3 className="text-lg font-semibold text-foreground">No appointments yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Once you book an appointment, it will appear here with live status updates.
        </p>
        <Button asChild className="mt-6 rounded-full px-6">
          <Link href="/search">Find a doctor</Link>
        </Button>
      </div>
    );
  }

  const connectionBadge = useMemo(() => {
    switch (connectionState) {
      case "open":
        return (
          <Badge variant="secondary" className="flex items-center gap-1 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]">
            <Wifi className="h-3.5 w-3.5" />
            Live
          </Badge>
        );
      case "connecting":
        return (
          <Badge variant="outline" className="flex items-center gap-1 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]">
            <Wifi className="h-3.5 w-3.5 animate-pulse" />
            Connecting
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" className="flex items-center gap-1 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]">
            <WifiOff className="h-3.5 w-3.5" />
            Reconnecting
          </Badge>
        );
      case "closed":
      case "idle":
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]">
            <WifiOff className="h-3.5 w-3.5" />
            Offline
          </Badge>
        );
    }
  }, [connectionState]);

  const feedbackMutation = useMutation<
    Appointment,
    unknown,
    { appointmentId: string; payload: AppointmentFeedbackPayload }
  >({
    mutationFn: ({ appointmentId, payload }) =>
      appointmentsApi.submitFeedback(appointmentId, payload),
    onSuccess: (updated) => {
      updateAppointmentsState((items) => upsertAppointment(items, updated as ExtendedAppointment));
      toast.success("Thanks for sharing your feedback!");
    },
    onError: () => {
      toast.error("We couldn't send your feedback. Please try again shortly.");
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end">
        {connectionBadge}
      </div>
      {displayAppointments.map((appointment) => (
        <AppointmentCard
          key={appointment._id}
          appointment={appointment}
          onSubmitFeedback={(payload) =>
            feedbackMutation.mutate({ appointmentId: appointment._id, payload })
          }
          submittingFeedback={
            feedbackMutation.isPending && feedbackMutation.variables?.appointmentId === appointment._id
          }
        />
      ))}
    </div>
  );
};

const AppointmentCard = ({
  appointment,
  onSubmitFeedback,
  submittingFeedback,
}: {
  appointment: ExtendedAppointment;
  onSubmitFeedback: (payload: AppointmentFeedbackPayload) => void;
  submittingFeedback: boolean;
}) => {
  const isTelehealth = appointment.mode === "telehealth";
  const formattedDate = format(new Date(appointment.scheduledAt), "EEE, dd MMM yyyy");
  const formattedTime = format(new Date(appointment.scheduledAt), "hh:mm a");
  const consultation = appointment.consultation;
  const countdownLabel = useCountdown(appointment.scheduledAt, appointment.status);
  const joinUrl = deriveTelehealthLink(appointment);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const hasFeedback = Boolean(appointment.feedback?.rating);

  const showJoinButton =
    appointment.status === "confirmed" ||
    appointment.status === "checked-in" ||
    appointment.status === "in-session";

  return (
    <div className="flex flex-col gap-5 rounded-3xl bg-white/95 p-6 shadow-xl shadow-primary/10 transition duration-200 hover:-translate-y-1 hover:shadow-brand-card dark:bg-card/90 dark:shadow-[0_30px_65px_-30px_rgba(2,6,23,0.85)] dark:ring-1 dark:ring-primary/20 md:flex-row md:items-center md:justify-between">
      <div className="flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-semibold text-foreground">{appointment.doctor.name}</h3>
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            {appointment.doctor.specialization}
          </Badge>
          <Badge
            variant={statusVariantMap[appointment.status] ?? "outline"}
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
            {isTelehealth ? <Video className="h-4 w-4 text-primary" /> : <MapPin className="h-4 w-4 text-primary" />}
            {isTelehealth
              ? "Telehealth"
              : appointment.doctor.clinicLocations?.[0]?.name ?? "Clinic visit"}
          </span>
          {countdownLabel && (
            <span className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-primary">
              <Timer className="h-4 w-4" />
              {countdownLabel}
            </span>
          )}
        </div>
        {appointment.reasonForVisit && (
          <p className="text-sm text-muted-foreground">
            Reason: {appointment.reasonForVisit}
          </p>
        )}
        {appointment.payment && (
          <p className="text-xs text-muted-foreground/80">
            Payment status: <span className="font-medium text-foreground">{appointment.payment.status}</span>
            {appointment.payment.receipt ? ` • Receipt ${appointment.payment.receipt}` : ""}
          </p>
        )}
        {consultation?.followUpActions && consultation.followUpActions.length > 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">Next steps</p>
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
                  {entry.label}: <span className="font-medium text-foreground">{entry.value}</span>
                  {entry.unit ? ` ${entry.unit}` : ""}
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
                    <a className="text-primary underline" href={attachment.url} target="_blank" rel="noreferrer">
                      {attachment.name}
                    </a>
                  ) : (
                    <span>{attachment.name}</span>
                  )}
                  {attachment.sizeInBytes ? ` · ${(attachment.sizeInBytes / 1024).toFixed(1)} KB` : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {consultation?.notes && appointment.status === "completed" && (
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground/90">
            <p className="font-medium text-foreground">Visit summary</p>
            <p className="mt-1 whitespace-pre-wrap">{consultation.notes}</p>
          </div>
        )}
        {appointment.feedback?.rating && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
            <Badge variant="secondary" className="flex items-center gap-1 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]">
              <Star className="h-3 w-3" />
              {appointment.feedback.rating.toFixed(1)}
            </Badge>
            {appointment.feedback.comments ? <span>{appointment.feedback.comments}</span> : null}
            {appointment.feedback.submittedAt ? (
              <span className="text-muted-foreground/60">
                • {formatDistanceToNowStrict(new Date(appointment.feedback.submittedAt), { addSuffix: true })}
              </span>
            ) : null}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 md:flex-row">
        <Button variant="outline" className="rounded-full px-6" disabled>
          Reschedule
        </Button>
        {appointment.status === "pending-payment" ? (
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
        {appointment.status === "completed" && !hasFeedback ? (
          <Button
            variant="outline"
            className="rounded-full px-6"
            onClick={() => {
              setSelectedRating(appointment.feedback?.rating ?? null);
              setFeedbackNotes(appointment.feedback?.comments ?? "");
              setIsFeedbackOpen(true);
            }}
          >
            Share feedback
          </Button>
        ) : null}
      </div>

      <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>How was your visit?</DialogTitle>
            <DialogDescription>Share a quick rating so we can keep improving your experience.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Rate your consultation</Label>
              <div className="flex gap-2">
                {ratingOptions.map((rating) => {
                  const active = selectedRating === rating;
                  return (
                    <Button
                      key={rating}
                      type="button"
                      variant={active ? "secondary" : "outline"}
                      className="h-10 w-10 rounded-full text-sm"
                      onClick={() => setSelectedRating(rating)}
                    >
                      {rating}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`feedback-notes-${appointment._id}`}>Anything you’d like us to know?</Label>
              <Textarea
                id={`feedback-notes-${appointment._id}`}
                placeholder="Optional: what went well or what could be better next time."
                value={feedbackNotes}
                onChange={(event) => setFeedbackNotes(event.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsFeedbackOpen(false)} disabled={submittingFeedback}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedRating) {
                  toast.error("Please select a rating before submitting.");
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
    </div>
  );
};

