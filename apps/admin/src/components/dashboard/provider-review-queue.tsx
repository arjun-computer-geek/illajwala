"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@illajwala/ui";
import type { Doctor, DoctorReviewStatus } from "@illajwala/types";
import { toast } from "sonner";
import { ClipboardCheck, FileWarning, MailCheck, Pencil, RefreshCw } from "lucide-react";
import { providersApi } from "../../lib/api/providers";
import { useAdminAuth } from "../../hooks/use-auth";

const statusMeta: Record<
  DoctorReviewStatus,
  { label: string; badgeVariant: "outline" | "secondary" | "destructive"; description: string }
> = {
  pending: {
    label: "Pending review",
    badgeVariant: "outline",
    description: "Awaiting credential verification",
  },
  "needs-info": {
    label: "Needs info",
    badgeVariant: "destructive",
    description: "More documentation requested",
  },
  approved: {
    label: "Approved",
    badgeVariant: "secondary",
    description: "Ready for activation",
  },
  active: {
    label: "Active",
    badgeVariant: "secondary",
    description: "Clinic live on VisitNow",
  },
};

const formatDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export const ProviderReviewQueue = () => {
  const { admin } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const loadProviders = useCallback(async (showSpinner = true) => {
    if (showSpinner) {
      setIsLoading(true);
    }
    try {
      const data = await providersApi.listProviders();
      setDoctors(data);
    } catch (error) {
      console.error("[admin] Failed to load providers", error);
      toast.error("Unable to load provider queue", {
        description: "Retry in a moment or check identity-service.",
      });
    } finally {
      if (showSpinner) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadProviders(true);
  }, [loadProviders]);

  const pendingCount = useMemo(
    () => doctors.filter((doctor) => doctor.reviewStatus === "pending").length,
    [doctors]
  );

  const handleReview = async (doctor: Doctor, status: DoctorReviewStatus) => {
    if (status === "needs-info") {
      const message = window.prompt(
        "Request additional information from this provider. Include specific items you need.",
        ""
      );
      if (!message) {
        return;
      }
      await submitReview(doctor._id, status, message);
      return;
    }

    await submitReview(doctor._id, status);
  };

  const submitReview = async (id: string, status: DoctorReviewStatus, note?: string) => {
    try {
      setProcessingId(id);
      const updated = await providersApi.reviewDoctor(id, {
        status,
        note,
        author: admin?.name ?? admin?.email ?? "Admin",
      });
      setDoctors((current) => current.map((doc) => (doc._id === updated._id ? updated : doc)));
      const meta = statusMeta[status];
      toast.success(meta.label, {
        description: note ? note : meta.description,
      });
    } catch (error) {
      console.error("[admin] Failed to update provider status", error);
      toast.error("Unable to update provider status", {
        description: "Please try again. If the issue persists, notify the platform team.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleAddNote = async (doctor: Doctor) => {
    const message = window.prompt("Add a review note for this provider:", "");
    if (!message) {
      return;
    }
    try {
      setProcessingId(doctor._id);
      const updated = await providersApi.addReviewNote(doctor._id, {
        message,
        author: admin?.name ?? admin?.email ?? "Admin",
      });
      setDoctors((current) => current.map((doc) => (doc._id === updated._id ? updated : doc)));
      toast.success("Note added");
    } catch (error) {
      console.error("[admin] Failed to add provider note", error);
      toast.error("Unable to add note", {
        description: "Please retry in a moment.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadProviders(false);
    setIsRefreshing(false);
  };

  const renderChecklist = (doctor: Doctor) => {
    const checklist = doctor.onboardingChecklist ?? {
      kycComplete: false,
      payoutSetupComplete: false,
      telehealthReady: false,
    };

    const items = [
      { label: "KYC verified", done: checklist.kycComplete },
      { label: "Payout ready", done: checklist.payoutSetupComplete },
      { label: "Telehealth ready", done: checklist.telehealthReady },
    ];

    return (
      <div className="grid gap-2 sm:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 rounded-xl border border-border/50 bg-white/90 px-3 py-2 text-xs dark:border-border/40 dark:bg-background/70"
          >
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                item.done ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"
              }`}
            >
              {item.done ? "✓" : "•"}
            </span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="border border-border/60 bg-white/95 shadow-[0_28px_72px_-36px_rgba(32,113,182,0.28)] dark:border-border/40 dark:bg-background/85">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Provider review queue
            </CardTitle>
            <CardDescription>Centralise your credential checks before activating clinics.</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="rounded-full border-primary/40 bg-primary/10 text-primary">
              {pendingCount} pending
            </Badge>
            <Button size="sm" variant="ghost" className="gap-2 px-3 text-xs" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            No providers awaiting review. Once new clinics submit credentials, they will appear here for approval.
          </div>
        ) : (
          doctors.map((doctor) => {
            const meta = statusMeta[doctor.reviewStatus];
            const latestNote = doctor.reviewNotes?.slice(-1)[0];

            return (
              <div
                key={doctor._id}
                className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-white/90 px-5 py-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg dark:border-border/40 dark:bg-background/80"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-foreground">{doctor.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doctor.specialization} · {doctor.email}
                    </p>
                    {latestNote ? (
                      <p className="text-xs text-muted-foreground/80">
                        Last note ({formatDateTime(latestNote.createdAt)}): {latestNote.message}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground/80">No review notes yet.</p>
                    )}
                  </div>
                  <Badge
                    variant={meta.badgeVariant}
                    className="w-fit rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.32em]"
                  >
                    {meta.label}
                  </Badge>
                </div>

                <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-3">
                  <div>
                    <p className="font-medium text-foreground">Languages</p>
                    <p>{doctor.languages?.length ? doctor.languages.join(", ") : "Not provided"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Consultation modes</p>
                    <p>{doctor.consultationModes.join(", ")}</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Last reviewed</p>
                    <p>{formatDateTime(doctor.lastReviewedAt)}</p>
                  </div>
                </div>

                {renderChecklist(doctor)}

                <div className="space-y-2 rounded-xl border border-border/50 bg-muted/30 p-3 text-xs text-muted-foreground dark:border-border/40 dark:bg-background/70">
                  <p className="font-medium text-foreground">Review notes</p>
                  {doctor.reviewNotes?.length ? (
                    <ol className="space-y-1">
                      {doctor.reviewNotes.slice(-3).map((note) => (
                        <li key={note.createdAt} className="flex flex-col gap-0.5">
                          <span className="text-[0.7rem] uppercase tracking-[0.28em] text-muted-foreground/70">
                            {formatDateTime(note.createdAt)} · {note.author ?? "Admin"}
                          </span>
                          <span>{note.message}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p>No notes yet.</p>
                  )}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">{meta.description}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-2 rounded-full px-4 text-xs"
                      onClick={() => handleAddNote(doctor)}
                      disabled={processingId === doctor._id}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Add note
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 rounded-full px-4 text-xs"
                      onClick={() => handleReview(doctor, "needs-info")}
                      disabled={processingId === doctor._id}
                    >
                      <FileWarning className="h-3.5 w-3.5" />
                      Request info
                    </Button>
                    <Button
                      size="sm"
                      className="gap-2 rounded-full px-4 text-xs"
                      onClick={() => handleReview(doctor, "approved")}
                      disabled={processingId === doctor._id}
                    >
                      <ClipboardCheck className="h-3.5 w-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 rounded-full px-4 text-xs"
                      onClick={() => handleReview(doctor, "active")}
                      disabled={processingId === doctor._id || doctor.reviewStatus === "active"}
                    >
                      <ClipboardCheck className="h-3.5 w-3.5" />
                      Mark active
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-2 rounded-full px-4 text-xs"
                      onClick={() =>
                        toast.info("Reminder sent", {
                          description:
                            "Illajwala messaging-service will dispatch the reminder once integrated.",
                        })
                      }
                    >
                      <MailCheck className="h-3.5 w-3.5" />
                      Send reminder
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

