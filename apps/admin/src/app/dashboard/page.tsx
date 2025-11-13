"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@illajwala/ui";
import { Building2, LineChart, ShieldCheck } from "lucide-react";
import { useAdminAuth } from "../../hooks/use-auth";
import { ProviderReviewQueue } from "../../components/dashboard/provider-review-queue";
import { ActivityLog } from "../../components/dashboard/activity-log";

const summaryMetrics = [
  {
    title: "Clinics awaiting activation",
    value: "8",
    description: "Credential review queue · SLA <48h",
    icon: Building2,
  },
  {
    title: "Platform health score",
    value: "96%",
    description: "Conversion · cancellations · support SLAs",
    icon: LineChart,
  },
  {
    title: "Compliance checklist",
    value: "12/15",
    description: "Launch artefacts completed this week",
    icon: ShieldCheck,
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, hydrated, admin, clearAuth } = useAdminAuth();

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/auth/login?redirectTo=/dashboard");
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-muted/20 px-6 py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="rounded-3xl border border-border/60 bg-white/95 p-8 shadow-[0_36px_90px_-40px_rgba(32,113,182,0.32)] backdrop-blur-xl dark:border-border/40 dark:bg-background/85">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-4">
              <Badge variant="outline" className="rounded-full border-primary/40 bg-primary/10 px-4 py-2 text-xs uppercase tracking-[0.32em] text-primary">
                Admin control centre
              </Badge>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Welcome back, {admin?.name}
                </h1>
                <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                  Keep Illajwala launches calm: govern provider onboarding, monitor clinic health, and close compliance loops from one console.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                <Badge variant="outline" className="rounded-full border-border/60 bg-white/80 px-4 py-2">
                  Multi-tenant ready
                </Badge>
                <Badge variant="outline" className="rounded-full border-border/60 bg-white/80 px-4 py-2">
                  Maker-checker enforced
                </Badge>
                <Badge variant="outline" className="rounded-full border-border/60 bg-white/80 px-4 py-2">
                  Audit log synced
                </Badge>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <Button variant="outline" onClick={() => clearAuth()}>
                Sign out
              </Button>
              <p className="text-xs text-muted-foreground">
                Need help?{" "}
                <Link href="mailto:support@illajwala.com" className="text-primary underline">
                  support@illajwala.com
                </Link>
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {summaryMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card
                key={metric.title}
                className="border border-border/60 bg-white/95 px-6 py-5 shadow-[0_28px_70px_-38px_rgba(32,113,182,0.3)] transition hover:-translate-y-1 dark:border-border/40 dark:bg-background/85"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-3xl font-semibold text-foreground">{metric.value}</p>
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <ProviderReviewQueue />
          <ActivityLog />
        </section>
      </div>
    </main>
  );
}
