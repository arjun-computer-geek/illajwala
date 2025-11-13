"use client";

import { useEffect, useMemo, useState } from "react";
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
import type { Doctor } from "@illajwala/types";
import { toast } from "sonner";
import { providersApi } from "../../lib/api/providers";
import { ClipboardCheck, FileWarning, MailCheck, RefreshCw } from "lucide-react";

type ReviewStatus = "pending" | "approved" | "needs-info";

type ProviderReview = {
  doctor: Doctor;
  status: ReviewStatus;
  licenseId: string;
  submittedAt: string;
  documents: string[];
};

const deriveInitialStatus = (index: number): ReviewStatus => {
  const options: ReviewStatus[] = ["pending", "needs-info", "approved"];
  return options[index % options.length];
};

const statusMeta: Record<
  ReviewStatus,
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
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const ProviderReviewQueue = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<ProviderReview[]>([]);

  useEffect(() => {
    let mounted = true;
    providersApi
      .listProviders()
      .then((providers) => {
        if (!mounted) return;
        const payload = providers.slice(0, 9).map((doctor, index) => ({
          doctor,
          status: deriveInitialStatus(index),
          licenseId: `MED/${doctor.phone?.slice(-4) ?? "0000"}-${index + 1}`,
          submittedAt: new Date(Date.now() - index * 1000 * 60 * 90).toISOString(),
          documents: ["Medical license", "ID proof", index % 2 === 0 ? "Clinic lease" : "Specialty certificate"],
        }));
        setReviews(payload);
      })
      .catch((error) => {
        console.error("[admin] Failed to load providers", error);
        toast.error("Unable to load provider queue", { description: "Retry in a moment or check identity-service." });
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const pendingCount = useMemo(() => reviews.filter((review) => review.status === "pending").length, [reviews]);

  const updateStatus = (doctorId: string, status: ReviewStatus) => {
    setReviews((current) =>
      current.map((review) => (review.doctor._id === doctorId ? { ...review, status } : review))
    );
    const meta = statusMeta[status];
    toast.success(`Updated ${meta.label}`, {
      description: "Change stored locally for Sprint 0. Backend workflows will sync in Sprint 1.",
    });
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
            <Button size="sm" variant="ghost" className="gap-2 px-3 text-xs" onClick={() => window.location.reload()}>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            No providers awaiting review. Once new clinics submit credentials, they will appear here for approval.
          </div>
        ) : (
          reviews.map((item) => {
            const meta = statusMeta[item.status];
            return (
              <div
                key={item.doctor._id}
                className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-white/90 px-5 py-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg dark:border-border/40 dark:bg-background/80"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-base font-semibold text-foreground">{item.doctor.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.doctor.specialization} · License {item.licenseId}
                    </p>
                  </div>
                  <Badge variant={meta.badgeVariant} className="w-fit rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.32em]">
                    {meta.label}
                  </Badge>
                </div>

                <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-3">
                  <div>
                    <p className="font-medium text-foreground">Submitted</p>
                    <p>{formatDate(item.submittedAt)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Documents</p>
                    <p>{item.documents.join(", ")}</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Contact</p>
                    <p>{item.doctor.email}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">{meta.description}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 rounded-full px-4 text-xs"
                      onClick={() => updateStatus(item.doctor._id, "needs-info")}
                    >
                      <FileWarning className="h-3.5 w-3.5" />
                      Request info
                    </Button>
                    <Button
                      size="sm"
                      className="gap-2 rounded-full px-4 text-xs"
                      onClick={() => updateStatus(item.doctor._id, "approved")}
                    >
                      <ClipboardCheck className="h-3.5 w-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-2 rounded-full px-4 text-xs"
                      onClick={() => toast.info("Reminder sent", { description: "Illajwala messaging-service will deliver the follow-up once integrated." })}
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

