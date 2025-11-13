"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@illajwala/ui";
import { Building2, LineChart, ShieldCheck } from "lucide-react";
import { useAdminAuth } from "../../hooks/use-auth";
import { ProviderReviewQueue } from "../../components/dashboard/provider-review-queue";
import { ActivityLog } from "../../components/dashboard/activity-log";
import { BookingsTable } from "../../components/dashboard/bookings-table";
import { AdminShell } from "../../components/layout/admin-shell";

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
    <AdminShell
      title={`Welcome back, ${admin?.name}`}
      description="Review clinic onboarding, bookings, and compliance in one console."
      userName={admin?.name ?? admin?.email ?? "Admin"}
      onSignOut={clearAuth}
      actions={
        <Button asChild size="sm" variant="outline">
          <Link href="mailto:support@illajwala.com">Email support</Link>
        </Button>
      }
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {summaryMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title} className="rounded-lg border border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-2xl font-semibold text-foreground">{metric.value}</p>
                <CardDescription>{metric.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <BookingsTable />

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <ProviderReviewQueue />
        <ActivityLog />
      </section>
    </AdminShell>
  );
}
