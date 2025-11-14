"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { WaitlistEntry, WaitlistStatus } from "@illajwala/types";
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
  Input,
  Label,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@illajwala/ui";
import { toast } from "sonner";
import { Activity, Ban, CheckCircle2, ClipboardList, Send } from "lucide-react";
import { doctorWaitlistsApi } from "../../lib/api/waitlists";
import { useDoctorAuth } from "../../hooks/use-auth";

type WaitlistConsoleState =
  | { kind: "idle" | "loading" }
  | { kind: "ready"; entries: WaitlistEntry[] }
  | { kind: "error"; error: string };

type PromoteDialogState = {
  entry: WaitlistEntry;
  appointmentId: string;
  notes: string;
} | null;

type WaitlistFilter = "active" | "invited" | "promoted" | "expired" | "cancelled";

const filterOrder: WaitlistFilter[] = ["active", "invited", "promoted", "expired", "cancelled"];

const statusBadgeVariant: Partial<Record<WaitlistStatus, "default" | "secondary" | "outline" | "destructive">> = {
  active: "secondary",
  invited: "default",
  promoted: "default",
  expired: "outline",
  cancelled: "destructive",
};

const statusCopy: Record<WaitlistFilter, { label: string; description: string; icon: typeof Activity }> = {
  active: {
    label: "Active queue",
    description: "Current patients waiting for open slots.",
    icon: ClipboardList,
  },
  invited: {
    label: "Invited",
    description: "Invitations sent, awaiting confirmation.",
    icon: Send,
  },
  promoted: {
    label: "Promoted",
    description: "Converted to confirmed appointments.",
    icon: CheckCircle2,
  },
  expired: {
    label: "Expired",
    description: "Entries that lapsed without response.",
    icon: Activity,
  },
  cancelled: {
    label: "Cancelled",
    description: "Removed manually by clinicians or admins.",
    icon: Ban,
  },
};

const derivePatientLabel = (entry: WaitlistEntry) => {
  if (entry.metadata && typeof entry.metadata.patientName === "string") {
    return entry.metadata.patientName;
  }
  return entry.patientId;
};

const formatDate = (value?: string | Date | null) => {
  if (!value) {
    return null;
  }
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const filteredEntries = (entries: WaitlistEntry[], filter: WaitlistFilter) =>
  entries.filter((entry) => entry.status === filter);

export const WaitlistConsole = () => {
  const { doctor } = useDoctorAuth();
  const [state, setState] = useState<WaitlistConsoleState>({ kind: "idle" });
  const [activeTab, setActiveTab] = useState<WaitlistFilter>("active");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [promoteDialog, setPromoteDialog] = useState<PromoteDialogState>(null);

  const fetchWaitlist = useCallback(async () => {
    if (!doctor) {
      return;
    }
    setState({ kind: "loading" });
    try {
      const response = await doctorWaitlistsApi.list({
        pageSize: 100,
        sortBy: "priority",
      });
      setState({ kind: "ready", entries: response.data });
    } catch (error) {
      console.error("[doctor] Failed to load waitlist entries", error);
      setState({
        kind: "error",
        error: "We couldn’t load waitlist entries right now. Please retry shortly.",
      });
      toast.error("Waitlist unavailable", {
        description: "Refresh the page or contact support if the issue persists.",
      });
    }
  }, [doctor]);

  useEffect(() => {
    void fetchWaitlist();
  }, [fetchWaitlist]);

  const groupedEntries = useMemo(() => {
    if (state.kind !== "ready") {
      return new Map<WaitlistFilter, WaitlistEntry[]>();
    }
    const map = new Map<WaitlistFilter, WaitlistEntry[]>();
    for (const filter of filterOrder) {
      map.set(filter, filteredEntries(state.entries, filter));
    }
    return map;
  }, [state]);

  const refresh = useCallback(() => {
    void fetchWaitlist();
  }, [fetchWaitlist]);

  const handleStatusUpdate = useCallback(
    async (entry: WaitlistEntry, status: WaitlistStatus, note?: string) => {
      // Optimistic update
      if (state.kind === "ready") {
        const updatedEntries = state.entries.map((e) =>
          e._id === entry._id ? { ...e, status, notes: note || e.notes } : e
        );
        setState({ kind: "ready", entries: updatedEntries });
      }

      try {
        setProcessingId(entry._id);
        await doctorWaitlistsApi.updateStatus(entry._id, status, note);
        toast.success("Waitlist entry updated", {
          description: `Status set to ${status}`,
        });
        setNotesDraft("");
        // Refetch to ensure consistency
        await fetchWaitlist();
      } catch (error) {
        console.error("[doctor] Failed to update waitlist status", error);
        // Revert optimistic update on error
        await fetchWaitlist();
        toast.error("Unable to update waitlist entry", {
          description: "Try again in a moment.",
        });
      } finally {
        setProcessingId(null);
      }
    },
    [fetchWaitlist, state]
  );

  const handlePromote = useCallback(async () => {
    if (!promoteDialog) {
      return;
    }
    if (promoteDialog.appointmentId.trim().length === 0) {
      toast.error("Appointment reference required", {
        description: "Provide the appointment ID before promoting.",
      });
      return;
    }

    // Optimistic update
    if (state.kind === "ready") {
      const updatedEntries = state.entries.map((e) =>
        e._id === promoteDialog.entry._id
          ? { ...e, status: "promoted" as WaitlistStatus, promotedAppointmentId: promoteDialog.appointmentId.trim() }
          : e
      );
      setState({ kind: "ready", entries: updatedEntries });
    }

    try {
      setProcessingId(promoteDialog.entry._id);
      await doctorWaitlistsApi.promote(
        promoteDialog.entry._id,
        promoteDialog.appointmentId.trim(),
        promoteDialog.notes.trim() ? promoteDialog.notes.trim() : undefined
      );
      toast.success("Waitlist entry promoted", {
        description: "The patient has been moved into a confirmed slot.",
      });
      setPromoteDialog(null);
      setNotesDraft("");
      // Refetch to ensure consistency
      await fetchWaitlist();
    } catch (error) {
      console.error("[doctor] Failed to promote waitlist entry", error);
      // Revert optimistic update on error
      await fetchWaitlist();
      toast.error("Unable to promote waitlist entry", {
        description: "Ensure the appointment ID is valid and try again.",
      });
    } finally {
      setProcessingId(null);
    }
  }, [fetchWaitlist, promoteDialog, state]);

  const renderEntries = (entries: WaitlistEntry[]) => {
    if (state.kind === "loading") {
      return (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-2xl" />
          ))}
        </div>
      );
    }

    if (state.kind === "error") {
      return (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertTitle>Waitlist unavailable</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      );
    }

    if (entries.length === 0) {
      const copy = statusCopy[activeTab];
      return (
        <div className="rounded-2xl border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{copy.label}</p>
          <p className="mt-2 text-xs text-muted-foreground/90">{copy.description}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {entries.map((entry) => (
          <div
            key={entry._id}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-background/60 p-5 transition duration-200 hover:border-primary/40 hover:bg-background/80 md:flex-row md:items-center md:justify-between"
          >
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">{derivePatientLabel(entry)}</h3>
                <Badge
                  variant={statusBadgeVariant[entry.status] ?? "outline"}
                  className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
                >
                  {entry.status}
                </Badge>
                {entry.priorityScore ? (
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]">
                    Priority {entry.priorityScore}
                  </Badge>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground/90">
                {entry.requestedWindow?.notes ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-muted/30 px-3 py-1">
                    {entry.requestedWindow.notes}
                  </span>
                ) : null}
                {entry.requestedWindow?.start || entry.requestedWindow?.end ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-muted/30 px-3 py-1">
                    {formatDate(entry.requestedWindow?.start) ?? "Any"} – {formatDate(entry.requestedWindow?.end) ?? "Any"}
                  </span>
                ) : null}
                {entry.expiresAt ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-muted/30 px-3 py-1">
                    Expires {formatDate(entry.expiresAt)}
                  </span>
                ) : null}
              </div>
              {entry.notes ? (
                <div className="rounded-xl border border-dashed border-border/50 bg-muted/20 p-3 text-xs text-muted-foreground/90">
                  <p className="font-medium text-foreground">Notes</p>
                  <p>{entry.notes}</p>
                </div>
              ) : null}
            </div>
            <div className="flex flex-col gap-2 md:w-60">
              {entry.status === "active" ? (
                <Button
                  variant="secondary"
                  className="rounded-full px-4 text-xs"
                  disabled={processingId === entry._id}
                  onClick={() => void handleStatusUpdate(entry, "invited", notesDraft.trim() || undefined)}
                >
                  Send invite
                </Button>
              ) : null}
              {entry.status === "invited" ? (
                <Button
                  variant="secondary"
                  className="rounded-full px-4 text-xs"
                  disabled={processingId === entry._id}
                  onClick={() =>
                    setPromoteDialog({
                      entry,
                      appointmentId: "",
                      notes: "",
                    })
                  }
                >
                  Promote to appointment
                </Button>
              ) : null}
              {entry.status !== "cancelled" && entry.status !== "promoted" ? (
                <Button
                  variant="ghost"
                  className="rounded-full px-4 text-xs text-destructive"
                  disabled={processingId === entry._id}
                  onClick={() => void handleStatusUpdate(entry, "cancelled", notesDraft.trim() || undefined)}
                >
                  Cancel entry
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTabsContent = () => {
    if (state.kind !== "ready") {
      return renderEntries([]);
    }
    const entries = groupedEntries.get(activeTab) ?? [];
    return renderEntries(entries);
  };

  return (
    <Card className="rounded-lg border border-border bg-card shadow-sm">
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <ClipboardList className="h-5 w-5 text-primary" />
            Waitlist console
          </CardTitle>
          <CardDescription>Review and action patients waiting for openings.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full px-3 text-xs"
            disabled={state.kind === "loading"}
            onClick={() => refresh()}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as WaitlistFilter)} className="w-full">
          <TabsList className="grid w-full grid-cols-5 rounded-full bg-muted/40 p-1 text-xs">
            {filterOrder.map((filter) => (
              <TabsTrigger key={filter} value={filter} className="rounded-full capitalize">
                {filter}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={activeTab} className="mt-4">
            {renderTabsContent()}
          </TabsContent>
        </Tabs>
        <div className="space-y-3">
          <Label htmlFor="waitlist-notes" className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Notes (applies to next action)
          </Label>
          <Textarea
            id="waitlist-notes"
            placeholder="Jot down context to include when inviting or cancelling…"
            value={notesDraft}
            onChange={(event) => setNotesDraft(event.target.value)}
            rows={3}
          />
        </div>
      </CardContent>

      <Dialog open={Boolean(promoteDialog)} onOpenChange={(open) => (!open ? setPromoteDialog(null) : undefined)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Promote waitlist entry</DialogTitle>
            <DialogDescription>
              Confirm the appointment reference to move this patient from the waitlist into a booked slot.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="appointment-id">Appointment reference *</Label>
              <Input
                id="appointment-id"
                value={promoteDialog?.appointmentId ?? ""}
                onChange={(event) =>
                  setPromoteDialog((current) =>
                    current
                      ? {
                          ...current,
                          appointmentId: event.target.value,
                        }
                      : current
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promotion-notes">Internal notes (optional)</Label>
              <Textarea
                id="promotion-notes"
                value={promoteDialog?.notes ?? ""}
                onChange={(event) =>
                  setPromoteDialog((current) =>
                    current
                      ? {
                          ...current,
                          notes: event.target.value,
                        }
                      : current
                  )
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPromoteDialog(null)} disabled={processingId === promoteDialog?.entry._id}>
              Cancel
            </Button>
            <Button onClick={() => void handlePromote()} disabled={processingId === promoteDialog?.entry._id}>
              Promote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};


