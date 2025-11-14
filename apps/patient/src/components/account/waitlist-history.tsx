"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNowStrict } from "date-fns";
import { Clock, Calendar, X, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { patientWaitlistsApi } from "@/lib/api/waitlists";
import { queryKeys } from "@/lib/query-keys";
import type { WaitlistEntry } from "@illajwala/types";
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

const statusVariantMap: Record<WaitlistEntry["status"], "secondary" | "default" | "outline" | "destructive"> = {
  active: "secondary",
  invited: "default",
  promoted: "default",
  expired: "outline",
  cancelled: "destructive",
};

const formatStatus = (status: WaitlistEntry["status"]) => {
  switch (status) {
    case "active":
      return "Waiting";
    case "invited":
      return "Invited";
    case "promoted":
      return "Promoted";
    case "expired":
      return "Expired";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
};

export const WaitlistHistory = () => {
  const { isAuthenticated, role, patient } = useAuth();
  const queryClient = useQueryClient();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);
  const [cancelNotes, setCancelNotes] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.waitlists({ status: "active,invited,promoted,expired,cancelled" }),
    queryFn: () => patientWaitlistsApi.list({ pageSize: 50 }),
    enabled: isAuthenticated && role === "patient",
    staleTime: 30_000,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => patientWaitlistsApi.cancel(id, notes),
    onSuccess: () => {
      toast.success("Waitlist entry cancelled");
      void queryClient.invalidateQueries({ queryKey: queryKeys.waitlists() });
      setCancelDialogOpen(false);
      setSelectedEntry(null);
      setCancelNotes("");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to cancel waitlist entry");
    },
  });

  if (!isAuthenticated || role !== "patient") {
    return null;
  }

  const entries = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Waitlist History</h2>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load waitlist history. Please refresh the page.
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Waitlist History</h2>
        <div className="rounded-lg border border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          <Clock className="mx-auto mb-3 h-8 w-8 opacity-50" />
          <p>You haven't joined any waitlists yet.</p>
          <p className="mt-1 text-xs">When doctors have no available slots, you can join their waitlist to be notified when slots open up.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Waitlist History</h2>
      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry._id}
            className="rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariantMap[entry.status]}>{formatStatus(entry.status)}</Badge>
                  {entry.status === "promoted" && (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Converted to appointment
                    </Badge>
                  )}
                </div>

                <div className="space-y-1 text-sm">
                  {entry.requestedWindow?.start || entry.requestedWindow?.end ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Preferred:{" "}
                        {entry.requestedWindow.start
                          ? format(new Date(entry.requestedWindow.start), "MMM dd, yyyy hh:mm a")
                          : "Any"}{" "}
                        - {entry.requestedWindow.end ? format(new Date(entry.requestedWindow.end), "MMM dd, yyyy hh:mm a") : "Any"}
                      </span>
                    </div>
                  ) : null}

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Joined {formatDistanceToNowStrict(new Date(entry.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  {entry.expiresAt && entry.status === "active" ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span>Expires {formatDistanceToNowStrict(new Date(entry.expiresAt), { addSuffix: true })}</span>
                    </div>
                  ) : null}

                  {entry.notes ? (
                    <p className="text-xs text-muted-foreground">Note: {entry.notes}</p>
                  ) : null}
                </div>
              </div>

              {entry.status === "active" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedEntry(entry);
                    setCancelDialogOpen(true);
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Waitlist Entry</DialogTitle>
            <DialogDescription>Are you sure you want to remove yourself from this waitlist?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-notes">Reason (optional)</Label>
              <Textarea
                id="cancel-notes"
                placeholder="Let us know why you're cancelling..."
                value={cancelNotes}
                onChange={(e) => setCancelNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep waiting
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedEntry) {
                  cancelMutation.mutate({ id: selectedEntry._id, notes: cancelNotes || undefined });
                }
              }}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "Cancelling..." : "Cancel waitlist"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

