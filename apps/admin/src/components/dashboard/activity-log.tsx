"use client";

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@illajwala/ui";
import { Activity, BellRing, Building2, RefreshCcw } from "lucide-react";

type ActivityEntry = {
  id: string;
  title: string;
  description: string;
  actor: string;
  timestamp: string;
  type: "activation" | "compliance" | "incident" | "payout";
};

const typeMeta: Record<ActivityEntry["type"], { label: string; icon: React.ElementType; tone: string }> = {
  activation: { label: "Activation", icon: Building2, tone: "bg-emerald-500/10 text-emerald-600" },
  compliance: { label: "Compliance", icon: RefreshCcw, tone: "bg-amber-500/10 text-amber-600" },
  incident: { label: "Incident", icon: BellRing, tone: "bg-rose-500/10 text-rose-600" },
  payout: { label: "Payout", icon: Activity, tone: "bg-sky-500/10 text-sky-600" },
};

const sampleActivity: ActivityEntry[] = [
  {
    id: "1",
    title: "License uploaded: Skin Renewal Clinic",
    description: "Auto-validation succeeded. Awaiting secondary reviewer confirmation.",
    actor: "Priya · Ops",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    type: "activation",
  },
  {
    id: "2",
    title: "Telehealth scripts refreshed",
    description: "Updated consent policy rolled out across all dermatology clinics.",
    actor: "System",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    type: "compliance",
  },
  {
    id: "3",
    title: "Delayed payout flagged",
    description: "Finance to review Razorpay settlement for Dr. Verma (₹42,000 · 3 days pending).",
    actor: "Anil · Finance",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    type: "payout",
  },
  {
    id: "4",
    title: "High cancellation rate: Mumbai dermatology",
    description: "Triggered playbook: check waitlist routing, notify concierge team.",
    actor: "System",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    type: "incident",
  },
];

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });

export const ActivityLog = () => (
  <Card className="border border-border/60 bg-white/95 shadow-[0_28px_72px_-36px_rgba(32,113,182,0.28)] dark:border-border/40 dark:bg-background/85">
    <CardHeader className="pb-4">
      <CardTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Platform activity
      </CardTitle>
      <CardDescription>A quick pulse of operational and compliance signals for today.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {sampleActivity.map((entry) => {
        const meta = typeMeta[entry.type];
        const Icon = meta.icon;
        return (
          <div
            key={entry.id}
            className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-white/90 px-5 py-4 dark:border-border/40 dark:bg-background/80"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className={`flex size-9 items-center justify-center rounded-full text-sm font-semibold ${meta.tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{entry.title}</p>
                  <p className="text-xs text-muted-foreground">{entry.description}</p>
                </div>
              </div>
              <Badge variant="outline" className="rounded-full border-border/60 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                {formatTime(entry.timestamp)} · {entry.actor}
              </Badge>
            </div>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

