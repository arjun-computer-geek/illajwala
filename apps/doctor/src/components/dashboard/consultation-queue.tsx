"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@illajwala/ui";
import type { Appointment, AppointmentStatus } from "@illajwala/types";
import { CalendarClock, RefreshCw, Clock3, Stethoscope, FileText, Video, MapPin } from "lucide-react";
import { toast } from "sonner";
import { doctorAppointmentsApi } from "../../lib/api/appointments";
import { useDoctorAuth } from "../../hooks/use-auth";
import {
  type ConsultationRealtimeEvent,
  useConsultationRealtime,
} from "../../lib/realtime/consultations";
import { ConsultationWorkspace } from "./consultation-workspace";

type QueueFilter = "today" | "upcoming" | "completed";

// Grouping states allows us to keep the UI copy in a single place and tweak
// the back-end filters without scattering magic arrays.
const queueStatusMap: Record<QueueFilter, AppointmentStatus[]> = {
  today: ["confirmed", "checked-in", "in-session"],
  upcoming: ["pending-payment", "confirmed"],
  completed: ["completed", "cancelled", "no-show"],
};

type QueueState =
  | { kind: "idle" | "loading" }
  | { kind: "error"; error: string }
  | { kind: "ready"; appointments: Appointment[] };

type SummaryEditorState = {
  appointment: Appointment;
  mode: "complete" | "update";
};

const formatTimeRange = (scheduledAt: string) =>
  new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(scheduledAt));

const statusBadgeVariant: Partial<Record<AppointmentStatus, "default" | "secondary" | "outline" | "destructive">> = {
  confirmed: "secondary",
  "checked-in": "secondary",
  "in-session": "default",
  completed: "default",
  cancelled: "destructive",
  "no-show": "destructive",
};

const statusCopy: Record<AppointmentStatus, string> = {
  "pending-payment": "Pending payment",
  confirmed: "Confirmed",
  "checked-in": "Checked in",
  "in-session": "In session",
  completed: "Completed",
  cancelled: "Cancelled",
  "no-show": "No show",
};

const emptyCopy: Record<QueueFilter, { title: string; description: string }> = {
  today: {
    title: "All set for today",
    description: "Your confirmed and active consultations will appear here once patients check in.",
  },
  upcoming: {
    title: "No upcoming consults",
    description: "Once bookings are confirmed, they will show up with reminders and patient summaries.",
  },
  completed: {
    title: "No recent visits logged",
    description: "Closing a consultation will place the visit summary here for quick access.",
  },
};

const sortAppointmentsBySchedule = (appointments: Appointment[]) =>
  [...appointments].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

const upsertAppointment = (appointments: Appointment[], incoming: Appointment) => {
  const next = appointments.filter((appointment) => appointment._id !== incoming._id);
  next.push(incoming);
  return sortAppointmentsBySchedule(next);
};

const removeAppointment = (appointments: Appointment[], appointmentId: string) =>
  appointments.filter((appointment) => appointment._id !== appointmentId);

export const ConsultationQueue = () => {
  const { doctor, token } = useDoctorAuth();
  const [activeFilter, setActiveFilter] = useState<QueueFilter>("today");
  const [state, setState] = useState<QueueState>({ kind: "idle" });
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [summaryEditor, setSummaryEditor] = useState<SummaryEditorState | null>(null);
  const [summaryNotes, setSummaryNotes] = useState("");
  const [summaryFollowUps, setSummaryFollowUps] = useState("");
  const [noShowTarget, setNoShowTarget] = useState<Appointment | null>(null);
  const [workspaceAppointment, setWorkspaceAppointment] = useState<Appointment | null>(null);

  const fetchQueue = useCallback(
    async (filter: QueueFilter) => {
      if (!doctor) {
        return;
      }

      setState({ kind: "loading" });

      try {
        const response = await doctorAppointmentsApi.list({
          pageSize: 50,
        });

        setState({ kind: "ready", appointments: response.data });
      } catch (error) {
        console.error("[doctor] Failed to fetch consultation queue", error);
        setState({
          kind: "error",
          error: "We couldn't load your consultation queue. Please retry shortly.",
        });
        toast.error("Consultation queue unavailable", {
          description: "Try refreshing the view. Contact platform support if the issue persists.",
        });
      }
    },
    [doctor]
  );

  useEffect(() => {
    void fetchQueue(activeFilter);
  }, [activeFilter, fetchQueue]);

  const appointments = state.kind === "ready" ? state.appointments : [];
  const filteredAppointments = useMemo(() => {
    if (state.kind !== "ready") {
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
      if (event.type === "heartbeat") {
        return;
      }

      if (state.kind !== "ready") {
        void refresh();
        return;
      }

      const applyUpdate = (appointments: Appointment[]) => {
        if ("appointment" in event && event.appointment) {
          return upsertAppointment(appointments, event.appointment);
        }
        if ("appointmentId" in event && event.appointmentId) {
          return removeAppointment(appointments, event.appointmentId);
        }
        return appointments;
      };

      setState((current) => {
        if (current.kind !== "ready") {
          return current;
        }

        const nextAppointments = applyUpdate(current.appointments);
        return {
          kind: "ready",
          appointments: nextAppointments,
        };
      });
    },
    [refresh, state.kind]
  );

  const handleRealtimeError = useCallback(
    (error: Error) => {
      console.error("[doctor] Consultation realtime stream error", error);
      const now = Date.now();
      if (now - lastRealtimeErrorAtRef.current > 60000) {
        lastRealtimeErrorAtRef.current = now;
        toast.error("Live updates interrupted", {
          description: "We’re trying to reconnect. Use Refresh to stay in sync in the meantime.",
        });
      }
      void refresh();
    },
    [refresh]
  );

  const connectionState = useConsultationRealtime({
    token: token ?? null,
    enabled: Boolean(token && doctor),
    onEvent: handleRealtimeEvent,
    onError: handleRealtimeError,
  });

  useEffect(() => {
    if (state.kind !== "ready" && connectionState === "open") {
      void refresh();
    }
  }, [connectionState, refresh, state.kind]);

  const handleStatusUpdate = useCallback(
    async (appointment: Appointment, status: AppointmentStatus, options?: Parameters<typeof doctorAppointmentsApi.updateStatus>[1]) => {
      try {
        setProcessingId(appointment._id);
        const payload = {
          status,
          ...(options ?? {}),
        };
        await doctorAppointmentsApi.updateStatus(appointment._id, payload);
        toast.success("Appointment updated", {
          description: `Status set to ${statusCopy[status]}`,
        });
        await refresh();
      } catch (error) {
        console.error("[doctor] Failed to update appointment status", error);
        toast.error("Unable to update consultation", {
          description: "Please try again. If the issue persists, contact support.",
        });
      } finally {
        setProcessingId(null);
      }
    },
    [refresh]
  );

  const handleCheckIn = (appointment: Appointment) => {
    void handleStatusUpdate(appointment, "checked-in");
  };

  const handleStartConsultation = (appointment: Appointment) => {
    void handleStatusUpdate(appointment, "in-session");
  };

  const openSummaryEditor = (appointment: Appointment, mode: SummaryEditorState["mode"]) => {
    setSummaryNotes(appointment.consultation?.notes ?? "");
    setSummaryFollowUps((appointment.consultation?.followUpActions ?? []).join("\n"));
    setSummaryEditor({ appointment, mode });
  };

  const handleSummarySubmit = async () => {
    if (!summaryEditor) {
      return;
    }

    const trimmedNotes = summaryNotes.trim();
    const followUpActions = summaryFollowUps
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const payload = {
      consultation: {
        notes: trimmedNotes ? trimmedNotes : undefined,
        followUpActions: followUpActions.length > 0 ? followUpActions : undefined,
      },
    } as Parameters<typeof doctorAppointmentsApi.updateStatus>[1];

    if (summaryEditor.mode === "complete") {
      await handleStatusUpdate(summaryEditor.appointment, "completed", payload);
    } else {
      await handleStatusUpdate(summaryEditor.appointment, summaryEditor.appointment.status, payload);
    }

    setSummaryEditor(null);
    setSummaryNotes("");
    setSummaryFollowUps("");
  };

  const handleNoShow = () => {
    if (!noShowTarget) {
      return;
    }
    void handleStatusUpdate(noShowTarget, "no-show").finally(() => {
      setNoShowTarget(null);
    });
  };

  const connectionBadge = useMemo(() => {
    switch (connectionState) {
      case "open":
        return { variant: "secondary" as const, label: "Live" };
      case "connecting":
        return { variant: "outline" as const, label: "Connecting…" };
      case "error":
        return { variant: "destructive" as const, label: "Reconnecting…" };
      case "closed":
        return { variant: "outline" as const, label: "Paused" };
      case "idle":
      default:
        return { variant: "outline" as const, label: "Offline" };
    }
  }, [connectionState]);

  useEffect(() => {
    if (!workspaceAppointment || state.kind !== "ready") {
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
            Monitor today&apos;s visits, jump into telehealth sessions, and access visit notes at a glance.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="gap-2 rounded-full px-3 text-xs"
            onClick={() => refresh()}
            disabled={state.kind === "loading"}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${state.kind === "loading" ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Badge variant={connectionBadge.variant} className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]">
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
            {state.kind === "loading" ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 rounded-2xl" />
                ))}
              </div>
            ) : state.kind === "error" ? (
              <Alert variant="destructive" className="rounded-2xl">
                <AlertTitle>Unable to load queue</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : filteredAppointments.length === 0 ? (
              <div className="rounded-2xl border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{emptyCopy[activeFilter].title}</p>
                <p className="mt-2 text-xs text-muted-foreground/90">{emptyCopy[activeFilter].description}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((appointment) => {
                  const specialist = appointment.doctor.specialization;
                  const modeIcon = appointment.mode === "telehealth" ? <Video className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />;
                  const modeLabel = appointment.mode === "telehealth" ? "Telehealth" : "In-clinic";
                  const showCheckIn = appointment.status === "confirmed";
                  const showStart = appointment.status === "checked-in";
                  const showComplete = appointment.status === "in-session";
                  const showUpdateNotes = appointment.status === "completed";
                  const disableActions = processingId === appointment._id;

                  return (
                    <div
                      key={appointment._id}
                      className="flex flex-col gap-4 rounded-2xl border border-border bg-background/50 p-5 transition duration-200 hover:border-primary/40 hover:bg-background/80 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-base font-semibold text-foreground">{appointment.patient?.name ?? "Unnamed patient"}</h3>
                          <Badge variant="outline" className="rounded-full border-border/40 bg-muted/40 px-3 py-1 text-[10px] uppercase tracking-[0.3em]">
                            {specialist}
                          </Badge>
                          <Badge variant={statusBadgeVariant[appointment.status] ?? "outline"} className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]">
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
                                hour: "2-digit",
                                minute: "2-digit",
                              }).format(new Date(appointment.consultation.startedAt))}
                            </span>
                          )}
                        </div>
                        {appointment.consultation?.followUpActions && appointment.consultation.followUpActions.length > 0 && (
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
                            onClick={() => handleCheckIn(appointment)}
                            disabled={disableActions}
                          >
                            Mark checked in
                          </Button>
                        ) : null}
                        {showStart ? (
                          <Button
                            variant="secondary"
                            className="rounded-full px-4 text-xs"
                            onClick={() => handleStartConsultation(appointment)}
                            disabled={disableActions}
                          >
                            Start consultation
                          </Button>
                        ) : null}
                        {showComplete ? (
                          <Button
                            variant="secondary"
                            className="rounded-full px-4 text-xs"
                            onClick={() => openSummaryEditor(appointment, "complete")}
                            disabled={disableActions}
                          >
                            Complete visit
                          </Button>
                        ) : null}
                        {(appointment.status === "checked-in" || appointment.status === "in-session") && (
                          <Button
                            variant="outline"
                            className="rounded-full px-4 text-xs"
                            onClick={() => setWorkspaceAppointment(appointment)}
                            disabled={disableActions}
                          >
                            Open workspace
                          </Button>
                        )}
                        {showUpdateNotes ? (
                          <Button
                            variant="outline"
                            className="rounded-full px-4 text-xs"
                            onClick={() => openSummaryEditor(appointment, "update")}
                            disabled={disableActions}
                          >
                            Update visit summary
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          className="rounded-full px-4 text-xs text-destructive"
                          onClick={() => setNoShowTarget(appointment)}
                          disabled={disableActions || appointment.status === "no-show"}
                        >
                          Mark no-show
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {activeFilter === "today" && upcomingCount > 0 ? (
          connectionState === "open" ? (
            <Alert className="rounded-2xl bg-primary/5 text-xs text-primary">
              <AlertTitle>Live updates on</AlertTitle>
              <AlertDescription>
                Consultation changes will flow in automatically. We&apos;ll keep this view current while you work.
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

      <Dialog open={Boolean(summaryEditor)} onOpenChange={(open) => (!open ? setSummaryEditor(null) : undefined)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {summaryEditor?.mode === "complete" ? "Complete consultation" : "Update visit summary"}
            </DialogTitle>
            <DialogDescription>
              Add visit notes and follow-up actions. Patients receive these details via email once you save.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="consultation-notes">Visit summary</Label>
              <Textarea
                id="consultation-notes"
                placeholder="Eg. Discussed medication schedule. Suggested lifestyle changes..."
                value={summaryNotes}
                onChange={(event) => setSummaryNotes(event.target.value)}
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consultation-followups">Follow-up actions (one per line)</Label>
              <Textarea
                id="consultation-followups"
                placeholder={"Book follow-up visit in 4 weeks\nComplete blood test at partner lab"}
                value={summaryFollowUps}
                onChange={(event) => setSummaryFollowUps(event.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setSummaryEditor(null)}
              disabled={processingId === summaryEditor?.appointment._id}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleSummarySubmit()}
              disabled={processingId === summaryEditor?.appointment._id}
            >
              {summaryEditor?.mode === "complete" ? "Complete visit" : "Save summary"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(noShowTarget)} onOpenChange={(open) => (!open ? setNoShowTarget(null) : undefined)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark as no-show?</DialogTitle>
            <DialogDescription>
              We&apos;ll notify the patient and keep the appointment in your completed list for reference.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNoShowTarget(null)} disabled={processingId === noShowTarget?._id}>
              Keep pending
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleNoShow()}
              disabled={processingId === noShowTarget?._id}
            >
              Confirm no-show
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                if (status === "completed") {
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


