'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CircleAlert, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { appointmentsApi } from '@/lib/api/appointments';
import { queryKeys } from '@/lib/query-keys';
import type { Appointment, AppointmentFeedbackPayload } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { type AppointmentRealtimeEvent, useAppointmentRealtime } from '@/lib/realtime/appointments';
import { AppointmentsFilter } from './appointments-filter';
import { AppointmentCard } from './appointments-list/appointment-card';
import {
  sortAppointmentsBySchedule,
  upsertAppointment,
  removeAppointment,
  type ExtendedAppointment,
} from './appointments-list/utils';

export const AppointmentsList = () => {
  const { isAuthenticated, hydrated, token } = useAuth();
  const queryClient = useQueryClient();
  const [liveAppointments, setLiveAppointments] = useState<ExtendedAppointment[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<Appointment['status'] | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<{ from?: Date; to?: Date } | null>(null);
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
    [data],
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
    [queryClient],
  );

  const handleRealtimeEvent = useCallback(
    (event: AppointmentRealtimeEvent) => {
      if (event.type === 'heartbeat') {
        return;
      }

      if ('appointment' in event && event.appointment) {
        updateAppointmentsState((items) =>
          upsertAppointment(items, event.appointment as ExtendedAppointment),
        );
        return;
      }

      if ('appointmentId' in event && event.appointmentId) {
        updateAppointmentsState((items) => removeAppointment(items, event.appointmentId));
        return;
      }
    },
    [updateAppointmentsState],
  );

  const handleRealtimeError = useCallback(() => {
    const now = Date.now();
    if (now - lastRealtimeErrorAtRef.current > 60_000) {
      lastRealtimeErrorAtRef.current = now;
      toast.error('Live appointment updates interrupted', {
        description: 'We’re reconnecting in the background. You can refresh to force an update.',
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
          <span>
            We couldn&apos;t load your appointments. Please refresh the page or try again later.
          </span>
        </div>
        <Button variant="secondary" size="sm" className="rounded-full" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const displayAppointments = useMemo(() => {
    let filtered = liveAppointments ?? appointments;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((apt) => apt.status === statusFilter);
    }

    // Filter by date range
    if (dateFilter?.from || dateFilter?.to) {
      filtered = filtered.filter((apt) => {
        const aptDate = new Date(apt.scheduledAt);
        if (dateFilter.from && aptDate < dateFilter.from) {
          return false;
        }
        if (dateFilter.to) {
          const toDate = new Date(dateFilter.to);
          toDate.setHours(23, 59, 59, 999);
          if (aptDate > toDate) {
            return false;
          }
        }
        return true;
      });
    }

    return filtered;
  }, [liveAppointments, appointments, statusFilter, dateFilter]);

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
      case 'open':
        return (
          <Badge
            variant="secondary"
            className="flex items-center gap-1 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
          >
            <Wifi className="h-3.5 w-3.5" />
            Live
          </Badge>
        );
      case 'connecting':
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
          >
            <Wifi className="h-3.5 w-3.5 animate-pulse" />
            Connecting
          </Badge>
        );
      case 'error':
        return (
          <Badge
            variant="destructive"
            className="flex items-center gap-1 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
          >
            <WifiOff className="h-3.5 w-3.5" />
            Reconnecting
          </Badge>
        );
      case 'closed':
      case 'idle':
      default:
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
          >
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
      toast.success('Thanks for sharing your feedback!');
    },
    onError: () => {
      toast.error("We couldn't send your feedback. Please try again shortly.");
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <AppointmentsFilter
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          dateFilter={dateFilter}
          onDateChange={setDateFilter}
        />
        {connectionBadge}
      </div>
      {displayAppointments.length === 0 ? (
        <div className="rounded-3xl bg-white/95 p-10 text-center shadow-xl shadow-primary/10 dark:bg-card/90 dark:shadow-[0_30px_65px_-30px_rgba(2,6,23,0.85)] dark:ring-1 dark:ring-primary/20">
          <h3 className="text-lg font-semibold text-foreground">
            No appointments match your filters
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your status or date range filters to see more results.
          </p>
        </div>
      ) : (
        displayAppointments.map((appointment) => (
          <AppointmentCard
            key={appointment._id}
            appointment={appointment}
            onSubmitFeedback={(payload) =>
              feedbackMutation.mutate({ appointmentId: appointment._id, payload })
            }
            submittingFeedback={
              feedbackMutation.isPending &&
              feedbackMutation.variables?.appointmentId === appointment._id
            }
          />
        ))
      )}
    </div>
  );
};
