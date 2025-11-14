"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Textarea,
} from "@illajwala/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { AlertTriangle, ClipboardList, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { Clinic, WaitlistEntry, WaitlistPolicy } from "@illajwala/types";
import { adminWaitlistsApi } from "@/lib/api/waitlists";
import { adminClinicsApi } from "@/lib/api/clinics";
import { adminQueryKeys } from "@/lib/query-keys";

type ClinicFilter = "all" | string;

type PolicyFormState = {
  maxQueueSize: string;
  autoExpiryHours: string;
  autoPromoteBufferMinutes: string;
  notes: string;
};

const derivePatientLabel = (entry: WaitlistEntry) => {
  if (entry.patientId) {
    return entry.patientId;
  }
  return "Unknown patient";
};

const calculateAverageWaitMinutes = (entries: WaitlistEntry[]) => {
  if (!entries.length) {
    return null;
  }
  const now = Date.now();
  const total = entries.reduce((accumulator, entry) => {
    const created = new Date(entry.createdAt ?? Date.now()).getTime();
    return accumulator + (now - created);
  }, 0);
  const averageMs = total / entries.length;
  return Math.round(averageMs / 60000);
};

export const WaitlistOversightPanel = () => {
  const queryClient = useQueryClient();
  const [clinicFilter, setClinicFilter] = useState<ClinicFilter>("all");
  const [policyForm, setPolicyForm] = useState<PolicyFormState>({
    maxQueueSize: "",
    autoExpiryHours: "",
    autoPromoteBufferMinutes: "",
    notes: "",
  });

  const selectedClinicId = clinicFilter === "all" ? null : clinicFilter;

  const waitlistQuery = useQuery({
    queryKey: adminQueryKeys.waitlistEntries(selectedClinicId),
    queryFn: () =>
      adminWaitlistsApi.list({
        clinicId: selectedClinicId ?? undefined,
        pageSize: 100,
        sortBy: "priority",
      }),
    staleTime: 60_000,
  });

  const policyQuery = useQuery({
    queryKey: adminQueryKeys.waitlistPolicy(selectedClinicId),
    queryFn: () => adminWaitlistsApi.getPolicy(selectedClinicId ?? undefined),
    enabled: !waitlistQuery.isPending,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (policyQuery.data) {
      setPolicyForm({
        maxQueueSize: String(policyQuery.data.maxQueueSize ?? 0),
        autoExpiryHours: String(policyQuery.data.autoExpiryHours ?? 0),
        autoPromoteBufferMinutes: String(policyQuery.data.autoPromoteBufferMinutes ?? 0),
        notes: "",
      });
    }
  }, [policyQuery.data, selectedClinicId]);

  const policyMutation = useMutation({
    mutationFn: adminWaitlistsApi.upsertPolicy,
    onSuccess: (updatedPolicy) => {
      toast.success("Waitlist policy updated", {
        description: "Changes saved. Updates propagate to new entries immediately.",
      });
      setPolicyForm((current) => ({
        ...current,
        maxQueueSize: String(updatedPolicy.maxQueueSize ?? current.maxQueueSize),
        autoExpiryHours: String(updatedPolicy.autoExpiryHours ?? current.autoExpiryHours),
        autoPromoteBufferMinutes: String(updatedPolicy.autoPromoteBufferMinutes ?? current.autoPromoteBufferMinutes),
        notes: "",
      }));
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.waitlistPolicy(selectedClinicId) });
    },
    onError: () => {
      toast.error("Unable to update waitlist policy", {
        description: "Try again in a moment or contact platform support.",
      });
    },
  });

  const entries = waitlistQuery.data?.data ?? [];

  const clinicsQuery = useQuery({
    queryKey: adminQueryKeys.clinics(),
    queryFn: () => adminClinicsApi.list({ pageSize: 100 }),
    staleTime: 5 * 60_000,
  });

  const clinics = clinicsQuery.data?.data ?? [];

  const statusBuckets = useMemo(() => {
    const buckets: Record<WaitlistEntry["status"], WaitlistEntry[]> = {
      active: [],
      invited: [],
      promoted: [],
      expired: [],
      cancelled: [],
    };
    for (const entry of entries) {
      buckets[entry.status]?.push(entry);
    }
    return buckets;
  }, [entries]);

  const averageQueueWait = useMemo(() => {
    const waitingEntries = [...statusBuckets.active, ...statusBuckets.invited];
    return calculateAverageWaitMinutes(waitingEntries);
  }, [statusBuckets]);

  const handlePolicySave = () => {
    const maxQueueSize = Number(policyForm.maxQueueSize);
    const autoExpiryHours = Number(policyForm.autoExpiryHours);
    const autoPromoteBufferMinutes = Number(policyForm.autoPromoteBufferMinutes);

    if (!Number.isFinite(maxQueueSize) || maxQueueSize <= 0) {
      toast.error("Invalid max queue size", {
        description: "Provide a positive number of allowed waitlist entries.",
      });
      return;
    }

    if (!Number.isFinite(autoExpiryHours) || autoExpiryHours <= 0) {
      toast.error("Invalid auto expiry window", {
        description: "Provide a positive number of hours before entries expire.",
      });
      return;
    }

    if (!Number.isFinite(autoPromoteBufferMinutes) || autoPromoteBufferMinutes <= 0) {
      toast.error("Invalid auto promote buffer", {
        description: "Provide a positive number of minutes for promotion buffers.",
      });
      return;
    }

    policyMutation.mutate({
      clinicId: selectedClinicId ?? undefined,
      maxQueueSize,
      autoExpiryHours,
      autoPromoteBufferMinutes,
    });
  };

  const renderEntries = () => {
    if (waitlistQuery.isLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-lg" />
          ))}
        </div>
      );
    }

    if (waitlistQuery.isError) {
      return (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive">
          Unable to load waitlist entries right now. Refresh or verify the identity-service is reachable.
        </div>
      );
    }

    if (entries.length === 0) {
      return (
        <div className="rounded-lg border border-muted-foreground/20 bg-muted/20 p-4 text-xs text-muted-foreground">
          No waitlist entries detected for this scope. Patients joining from the apps will appear here.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {entries.slice(0, 8).map((entry) => (
          <div
            key={entry._id}
            className="flex flex-col gap-2 rounded-lg border border-border bg-background/50 px-4 py-3 text-xs text-muted-foreground/90"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{derivePatientLabel(entry)}</span>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]">
                {entry.status}
              </Badge>
              {entry.clinicId ? (
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]">
                  Clinic {entry.clinicId}
                </Badge>
              ) : null}
              {entry.priorityScore ? (
                <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]">
                  Priority {entry.priorityScore}
                </Badge>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span>
                Added{" "}
                {entry.createdAt
                  ? formatDistanceToNowStrict(new Date(entry.createdAt), {
                      addSuffix: true,
                    })
                  : "recently"}
              </span>
              {entry.requestedWindow?.start || entry.requestedWindow?.end ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-muted/30 px-3 py-1">
                  {entry.requestedWindow?.start ? new Date(entry.requestedWindow.start).toLocaleString() : "Any"} –{" "}
                  {entry.requestedWindow?.end ? new Date(entry.requestedWindow.end).toLocaleString() : "Any"}
                </span>
              ) : null}
              {entry.expiresAt ? <span>Expires {new Date(entry.expiresAt).toLocaleString()}</span> : null}
            </div>
            {entry.notes ? <p className="text-xs text-muted-foreground/80">Notes: {entry.notes}</p> : null}
          </div>
        ))}
        {entries.length > 8 ? (
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            Showing top {Math.min(entries.length, 8)} of {entries.length} entries.
          </p>
        ) : null}
      </div>
    );
  };

  return (
    <Card className="rounded-lg border border-border bg-card shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              <ClipboardList className="h-4 w-4 text-primary" />
              Waitlist oversight
            </CardTitle>
            <CardDescription>
              Track queue depth, pending invitations, and policy settings across clinics.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 rounded-full px-3 text-xs"
            onClick={() => {
              void waitlistQuery.refetch();
              void policyQuery.refetch();
            }}
            disabled={waitlistQuery.isFetching || policyQuery.isFetching}
          >
            {waitlistQuery.isFetching || policyQuery.isFetching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Refresh
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="space-y-1">
            <Label htmlFor="admin-waitlist-clinic" className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Clinic scope
            </Label>
            <Select
              value={clinicFilter}
              onValueChange={(value) => setClinicFilter(value as ClinicFilter)}
              disabled={waitlistQuery.isLoading || clinicsQuery.isLoading}
            >
              <SelectTrigger id="admin-waitlist-clinic" className="w-44 rounded-full">
                <SelectValue placeholder="All clinics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clinics</SelectItem>
                {clinics.map((clinic) => (
                  <SelectItem key={clinic._id} value={clinic._id}>
                    {clinic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]">
              Active {statusBuckets.active.length}
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]">
              Invited {statusBuckets.invited.length}
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]">
              Promoted {statusBuckets.promoted.length}
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]">
              Expired {statusBuckets.expired.length}
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]">
              Cancelled {statusBuckets.cancelled.length}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {averageQueueWait !== null ? (
          <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-xs text-primary">
            Average wait for active and invited patients: {averageQueueWait} minutes.
          </div>
        ) : null}

        {renderEntries()}

        <div className="space-y-3 rounded-lg border border-border bg-background/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Waitlist policy</h3>
              <p className="text-[11px] text-muted-foreground/80">
                Adjust queue limits and expiry settings for {clinicFilter === "all" ? "tenant defaults" : `clinic ${clinicFilter}`}.
              </p>
            </div>
            {policyQuery.isFetching ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="waitlist-max-queue">Max queue size</Label>
              <Input
                id="waitlist-max-queue"
                inputMode="numeric"
                value={policyForm.maxQueueSize}
                onChange={(event) =>
                  setPolicyForm((current) => ({
                    ...current,
                    maxQueueSize: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="waitlist-expiry-hours">Auto expiry (hours)</Label>
              <Input
                id="waitlist-expiry-hours"
                inputMode="numeric"
                value={policyForm.autoExpiryHours}
                onChange={(event) =>
                  setPolicyForm((current) => ({
                    ...current,
                    autoExpiryHours: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="waitlist-promote-buffer">Auto promote buffer (minutes)</Label>
              <Input
                id="waitlist-promote-buffer"
                inputMode="numeric"
                value={policyForm.autoPromoteBufferMinutes}
                onChange={(event) =>
                  setPolicyForm((current) => ({
                    ...current,
                    autoPromoteBufferMinutes: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="waitlist-notes">Notes (optional)</Label>
            <Textarea
              id="waitlist-notes"
              placeholder="Record rationale for policy changes (internal)"
              value={policyForm.notes}
              onChange={(event) =>
                setPolicyForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              rows={3}
            />
            {policyForm.notes.trim() ? (
              <div className="mt-1 inline-flex items-center gap-2 text-[11px] text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5 text-primary" />
                Notes are not stored yet; add to runbooks if required.
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="rounded-full px-4 text-xs"
              onClick={handlePolicySave}
              disabled={policyMutation.isPending || policyQuery.isLoading}
            >
              {policyMutation.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
              Save policy
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full px-4 text-xs"
              onClick={() => {
                if (policyQuery.data) {
                  setPolicyForm({
                    maxQueueSize: String(policyQuery.data.maxQueueSize ?? 0),
                    autoExpiryHours: String(policyQuery.data.autoExpiryHours ?? 0),
                    autoPromoteBufferMinutes: String(policyQuery.data.autoPromoteBufferMinutes ?? 0),
                    notes: "",
                  });
                }
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-[11px] text-muted-foreground/80">
        Policy updates apply immediately to new entries. Existing entries honour previous settings until refreshed.
      </CardFooter>
    </Card>
  );
};


