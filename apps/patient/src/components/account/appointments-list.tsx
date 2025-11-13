"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarDays, Clock, Video, MapPin, CircleAlert } from "lucide-react";
import { appointmentsApi } from "@/lib/api/appointments";
import { queryKeys } from "@/lib/query-keys";
import type { Appointment } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

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

export const AppointmentsList = () => {
  const { isAuthenticated, hydrated } = useAuth();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.appointments(),
    queryFn: async () => appointmentsApi.list({ page: 1, pageSize: 10 }),
    enabled: hydrated && isAuthenticated,
    staleTime: 60_000,
  });

  // Keep memo to avoid re-render loops when the query refetches in the background.
  const appointments: Appointment[] = useMemo(() => data?.data ?? [], [data]);

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

  if (appointments.length === 0) {
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

  return (
    <div className="space-y-5">
      {appointments.map((appointment) => (
        <AppointmentCard key={appointment._id} appointment={appointment} />
      ))}
    </div>
  );
};

const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
  const isTelehealth = appointment.mode === "telehealth";
  const formattedDate = format(new Date(appointment.scheduledAt), "EEE, dd MMM yyyy");
  const formattedTime = format(new Date(appointment.scheduledAt), "hh:mm a");
  const consultation = appointment.consultation;

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
        {consultation?.notes && appointment.status === "completed" && (
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground/90">
            <p className="font-medium text-foreground">Visit summary</p>
            <p className="mt-1 whitespace-pre-wrap">{consultation.notes}</p>
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
          <Button variant="secondary" className="rounded-full px-6" disabled>
            Join telehealth (soon)
          </Button>
        ) : (
          <Button variant="secondary" className="rounded-full px-6" disabled>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};

