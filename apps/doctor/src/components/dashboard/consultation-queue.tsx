'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Dialog,
  DialogContent,
} from '@illajwala/ui';
import type { Appointment, AppointmentStatus } from '@illajwala/types';
import { RefreshCw, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';
import { doctorAppointmentsApi } from '../../lib/api/appointments';
import { useDoctorAuth } from '../../hooks/use-auth';
import {
  type ConsultationRealtimeEvent,
  useConsultationRealtime,
} from '../../lib/realtime/consultations';
import { ConsultationWorkspace } from './consultation-workspace';
import { AppointmentCard } from './consultation-queue/appointment-card';
import { SummaryEditorDialog } from './consultation-queue/summary-editor-dialog';
import { NoShowDialog } from './consultation-queue/no-show-dialog';
import {
  formatTimeRange,
  statusBadgeVariant,
  statusCopy,
  emptyCopy,
} from './consultation-queue/utils';

type QueueFilter = 'today' | 'upcoming' | 'completed';

// Grouping states allows us to keep the UI copy in a single place and tweak
// the back-end filters without scattering magic arrays.
const queueStatusMap: Record<QueueFilter, AppointmentStatus[]> = {
  today: ['confirmed', 'checked-in', 'in-session'],
  upcoming: ['pending-payment', 'confirmed'],
  completed: ['completed', 'cancelled', 'no-show'],
};

type QueueState =
  | { kind: 'idle' | 'loading' }
  | { kind: 'error'; error: string }
  | { kind: 'ready'; appointments: Appointment[] };

type SummaryEditorState = {
  appointment: Appointment;
  mode: 'complete' | 'update';
};

const sortAppointmentsBySchedule = (appointments: Appointment[]) =>
  [...appointments].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

const upsertAppointment = (appointments: Appointment[], incoming: Appointment) => {
  const next = appointments.filter((appointment) => appointment._id !== incoming._id);
  next.push(incoming);
  return sortAppointmentsBySchedule(next);
};

const removeAppointment = (appointments: Appointment[], appointmentId: string) =>
  appointments.filter((appointment) => appointment._id !== appointmentId);

export const ConsultationQueue = () => {
  const { doctor, token } = useDoctorAuth();
  const [activeFilter, setActiveFilter] = useState<QueueFilter>('today');
  const [state, setState] = useState<QueueState>({ kind: 'idle' });
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [summaryEditor, setSummaryEditor] = useState<SummaryEditorState | null>(null);
  const [summaryNotes, setSummaryNotes] = useState('');
  const [summaryFollowUps, setSummaryFollowUps] = useState('');
  const [noShowTarget, setNoShowTarget] = useState<Appointment | null>(null);
  const [workspaceAppointment, setWorkspaceAppointment] = useState<Appointment | null>(null);

  const fetchQueue = useCallback(
    async (filter: QueueFilter) => {
      if (!doctor) {
        return;
      }

      setState({ kind: 'loading' });

      try {
        const response = await doctorAppointmentsApi.list({
          pageSize: 50,
        });

        setState({ kind: 'ready', appointments: response.data });
      } catch (error) {
        console.error('[doctor] Failed to fetch consultation queue', error);
        setState({
          kind: 'error',
          error: "We couldn't load your consultation queue. Please retry shortly.",
        });
        toast.error('Consultation queue unavailable', {
          description: 'Try refreshing the view. Contact platform support if the issue persists.',
        });
      }
    },
    [doctor],
  );

  useEffect(() => {
    void fetchQueue(activeFilter);
  }, [activeFilter, fetchQueue]);

  const appointments = state.kind === 'ready' ? state.appointments : [];
  const filteredAppointments = useMemo(() => {
    if (state.kind !== 'ready') {
      return [] as Appointment[];
    }
    const allowed = new Set(queueStatusMap[activeFilter]);
    return state.appointments.filter((appointment) => allowed.has(appointment.status));
  }, [activeFilter, state]);

  const upcomingCount = filteredAppointments.length;

  const refresh = useCallback(() => fetchQueue(activeFilter), [activeFilter, fetchQueue]);

  const lastRealtimeErrorAtRef = useRef<number>(0);

  const handleRealtimeEvent = useCallback(
    (event: ConsultationRealtimeEvent) => {
      if (event.type === 'heartbeat') {
        return;
      }

      if (state.kind !== 'ready') {
        void refresh();
        return;
      }

      const applyUpdate = (appointments: Appointment[]) => {
        if ('appointment' in event && event.appointment) {
          return upsertAppointment(appointments, event.appointment);
        }
        if ('appointmentId' in event && event.appointmentId) {
          return removeAppointment(appointments, event.appointmentId);
        }
        return appointments;
      };

      setState((current) => {
        if (current.kind !== 'ready') {
          return current;
        }

        const nextAppointments = applyUpdate(current.appointments);
        return {
          kind: 'ready',
          appointments: nextAppointments,
        };
      });
    },
    [refresh, state.kind],
  );

  const handleRealtimeError = useCallback(
    (error: Error) => {
      console.error('[doctor] Consultation realtime stream error', error);
      const now = Date.now();
      if (now - lastRealtimeErrorAtRef.current > 60000) {
        lastRealtimeErrorAtRef.current = now;
        toast.error('Live updates interrupted', {
          description: 'We’re trying to reconnect. Use Refresh to stay in sync in the meantime.',
        });
      }
      void refresh();
    },
    [refresh],
  );

  const connectionState = useConsultationRealtime({
    token: token ?? null,
    enabled: Boolean(token && doctor),
    onEvent: handleRealtimeEvent,
    onError: handleRealtimeError,
  });

  useEffect(() => {
    if (state.kind !== 'ready' && connectionState === 'open') {
      void refresh();
    }
  }, [connectionState, refresh, state.kind]);

  const handleStatusUpdate = useCallback(
    async (
      appointment: Appointment,
      status: AppointmentStatus,
      options?: Parameters<typeof doctorAppointmentsApi.updateStatus>[1],
    ) => {
      try {
        setProcessingId(appointment._id);
        const payload = {
          status,
          ...(options ?? {}),
        };
        await doctorAppointmentsApi.updateStatus(appointment._id, payload);
        toast.success('Appointment updated', {
          description: `Status set to ${statusCopy[status]}`,
        });
        await refresh();
      } catch (error) {
        console.error('[doctor] Failed to update appointment status', error);
        toast.error('Unable to update consultation', {
          description: 'Please try again. If the issue persists, contact support.',
        });
      } finally {
        setProcessingId(null);
      }
    },
    [refresh],
  );

  const handleCheckIn = (appointment: Appointment) => {
    void handleStatusUpdate(appointment, 'checked-in');
  };

  const handleStartConsultation = (appointment: Appointment) => {
    void handleStatusUpdate(appointment, 'in-session');
  };

  const openSummaryEditor = (appointment: Appointment, mode: SummaryEditorState['mode']) => {
    setSummaryNotes(appointment.consultation?.notes ?? '');
    setSummaryFollowUps((appointment.consultation?.followUpActions ?? []).join('\n'));
    setSummaryEditor({ appointment, mode });
  };

  const handleSummarySubmit = async () => {
    if (!summaryEditor) {
      return;
    }

    const trimmedNotes = summaryNotes.trim();
    const followUpActions = summaryFollowUps
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const payload = {
      consultation: {
        notes: trimmedNotes ? trimmedNotes : undefined,
        followUpActions: followUpActions.length > 0 ? followUpActions : undefined,
      },
    } as Parameters<typeof doctorAppointmentsApi.updateStatus>[1];

    if (summaryEditor.mode === 'complete') {
      await handleStatusUpdate(summaryEditor.appointment, 'completed', payload);
    } else {
      await handleStatusUpdate(
        summaryEditor.appointment,
        summaryEditor.appointment.status,
        payload,
      );
    }

    setSummaryEditor(null);
    setSummaryNotes('');
    setSummaryFollowUps('');
  };

  const handleNoShow = () => {
    if (!noShowTarget) {
      return;
    }
    void handleStatusUpdate(noShowTarget, 'no-show').finally(() => {
      setNoShowTarget(null);
    });
  };

  const connectionBadge = useMemo(() => {
    switch (connectionState) {
      case 'open':
        return { variant: 'secondary' as const, label: 'Live' };
      case 'connecting':
        return { variant: 'outline' as const, label: 'Connecting…' };
      case 'error':
        return { variant: 'destructive' as const, label: 'Reconnecting…' };
      case 'closed':
        return { variant: 'outline' as const, label: 'Paused' };
      case 'idle':
      default:
        return { variant: 'outline' as const, label: 'Offline' };
    }
  }, [connectionState]);

  useEffect(() => {
    if (!workspaceAppointment || state.kind !== 'ready') {
      return;
    }

    const latest = state.appointments.find((item) => item._id === workspaceAppointment._id);
    if (latest && latest !== workspaceAppointment) {
      setWorkspaceAppointment(latest);
    }
  }, [state, workspaceAppointment]);

  return (
    <Card className="rounded-lg border border-border bg-card shadow-sm">
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Stethoscope className="h-5 w-5 text-primary" />
            Consultation queue
          </CardTitle>
          <CardDescription>
            Monitor today&apos;s visits, jump into telehealth sessions, and access visit notes at a
            glance.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="gap-2 rounded-full px-3 text-xs"
            onClick={() => refresh()}
            disabled={state.kind === 'loading'}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${state.kind === 'loading' ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Badge
            variant={connectionBadge.variant}
            className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
          >
            {connectionBadge.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs
          value={activeFilter}
          onValueChange={(value) => setActiveFilter(value as QueueFilter)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 rounded-full bg-muted/40 p-1 text-xs">
            <TabsTrigger value="today" className="rounded-full">
              Today&apos;s visits
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="rounded-full">
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-full">
              Completed
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeFilter} className="mt-4">
            {state.kind === 'loading' ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 rounded-2xl" />
                ))}
              </div>
            ) : state.kind === 'error' ? (
              <Alert variant="destructive" className="rounded-2xl">
                <AlertTitle>Unable to load queue</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : filteredAppointments.length === 0 ? (
              <div className="rounded-2xl border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{emptyCopy[activeFilter].title}</p>
                <p className="mt-2 text-xs text-muted-foreground/90">
                  {emptyCopy[activeFilter].description}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment._id}
                    appointment={appointment}
                    isProcessing={processingId === appointment._id}
                    onCheckIn={() => handleCheckIn(appointment)}
                    onStartConsultation={() => handleStartConsultation(appointment)}
                    onComplete={() => openSummaryEditor(appointment, 'complete')}
                    onUpdateNotes={() => openSummaryEditor(appointment, 'update')}
                    onOpenWorkspace={() => setWorkspaceAppointment(appointment)}
                    onMarkNoShow={() => setNoShowTarget(appointment)}
                    statusBadgeVariant={statusBadgeVariant}
                    statusCopy={statusCopy}
                    formatTimeRange={formatTimeRange}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {activeFilter === 'today' && upcomingCount > 0 ? (
          connectionState === 'open' ? (
            <Alert className="rounded-2xl bg-primary/5 text-xs text-primary">
              <AlertTitle>Live updates on</AlertTitle>
              <AlertDescription>
                Consultation changes will flow in automatically. We&apos;ll keep this view current
                while you work.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="rounded-2xl text-xs">
              <AlertTitle>Live updates paused</AlertTitle>
              <AlertDescription>
                We&apos;re retrying the connection. Use Refresh if you need an immediate update.
              </AlertDescription>
            </Alert>
          )
        ) : null}
      </CardContent>

      {summaryEditor && (
        <SummaryEditorDialog
          appointment={summaryEditor.appointment}
          mode={summaryEditor.mode}
          isOpen={Boolean(summaryEditor)}
          isProcessing={processingId === summaryEditor.appointment._id}
          onClose={() => setSummaryEditor(null)}
          onSubmit={() => void handleSummarySubmit()}
          notes={summaryNotes}
          followUps={summaryFollowUps}
          onNotesChange={setSummaryNotes}
          onFollowUpsChange={setSummaryFollowUps}
        />
      )}

      <NoShowDialog
        appointment={noShowTarget}
        isOpen={Boolean(noShowTarget)}
        isProcessing={processingId === noShowTarget?._id}
        onClose={() => setNoShowTarget(null)}
        onConfirm={() => handleNoShow()}
      />

      <Dialog
        open={Boolean(workspaceAppointment)}
        onOpenChange={(open) => (!open ? setWorkspaceAppointment(null) : undefined)}
      >
        <DialogContent className="max-w-3xl">
          {workspaceAppointment ? (
            <ConsultationWorkspace
              appointment={workspaceAppointment}
              isSaving={processingId === workspaceAppointment._id}
              onClose={() => setWorkspaceAppointment(null)}
              onSubmit={async (status, payload) => {
                await handleStatusUpdate(workspaceAppointment, status, payload);
                if (status === 'completed') {
                  setWorkspaceAppointment(null);
                }
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
