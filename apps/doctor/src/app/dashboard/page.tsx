"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from "@illajwala/ui";
import { Activity, CalendarClock, ClipboardCheck } from "lucide-react";
import { AvailabilityPlanner } from "../../components/availability/availability-planner";
import { useDoctorAuth } from "../../hooks/use-auth";
import { DoctorShell } from "../../components/layout/doctor-shell";
import { ConsultationQueue } from "../../components/dashboard/consultation-queue";
import { WaitlistConsole } from "../../components/dashboard/waitlist-console";

const dashboardHighlights = [
  {
    title: "Same-day confirmations",
    value: "92%",
    description: "of patient requests auto-confirmed",
    icon: CalendarClock,
  },
  {
    title: "No-show rate",
    value: "4.1%",
    description: "tracked from patient nudges",
    icon: Activity,
  },
  {
    title: "Pending approvals",
    value: "3",
    description: "staff invites awaiting verification",
    icon: ClipboardCheck,
  },
];

const clinicTasks = [
  {
    title: "Upload clinic signage",
    description: "Add your branding assets for visit reminders.",
    action: "Upload now",
    href: "#",
  },
  {
    title: "Set telehealth follow-ups",
    description: "Define default buffer time for remote consults.",
    action: "Configure",
    href: "#",
  },
  {
    title: "Review payouts",
    description: "Latest Razorpay reconciliation is ready for review.",
    action: "Open ledger",
    href: "#",
  },
];

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="h-32 animate-pulse rounded-xl bg-muted/40" />
    <div className="grid gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-32 rounded-lg" />
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Skeleton className="h-[520px] rounded-lg" />
      <div className="space-y-4">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  </div>
);

export default function DoctorDashboardPage() {
  const router = useRouter();
  const { doctor, hydrated, isAuthenticated, clearAuth } = useDoctorAuth();

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/auth/login?redirectTo=/dashboard");
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated) {
    return (
      <DoctorShell title="Loading dashboard" description="Preparing your clinic overview.">
        <DashboardSkeleton />
      </DoctorShell>
    );
  }

  if (!doctor || !isAuthenticated) {
    return null;
  }

  const clinic = doctor.clinicLocations?.[0];
  const doctorId = doctor._id ?? "unknown";
  const clinicLabel = clinic?.name ?? "Primary clinic";
  const clinicLocation = clinic?.city ? `${clinicLabel} · ${clinic.city}` : clinicLabel;

  return (
    <DoctorShell
      title={`Good day, Dr. ${doctor.name.split(" ")[0]}`}
      description="Publish availability, track visits, and stay on top of tasks."
      doctorName={doctor.name}
      clinicName={clinic?.name ?? clinic?.city ?? null}
      onSignOut={clearAuth}
      actions={
        <Button asChild size="sm" variant="outline">
          <Link href="/profile">Edit profile</Link>
        </Button>
      }
    >
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-lg border border-border bg-card shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Today&apos;s schedule</CardTitle>
            <CardDescription>Keep your clinic operations flowing smoothly.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-md border border-dashed border-border bg-muted/20 p-3">
              <p className="text-xs font-medium text-muted-foreground">Clinic</p>
              <p className="text-sm font-semibold text-foreground">{clinicLocation}</p>
            </div>
            <div className="rounded-md border border-dashed border-border bg-muted/20 p-3">
              <p className="text-xs font-medium text-muted-foreground">Availability drafts</p>
              <p className="text-sm text-foreground">Auto-save enabled</p>
            </div>
            <div className="rounded-md border border-dashed border-border bg-muted/20 p-3">
              <p className="text-xs font-medium text-muted-foreground">Patient nudges</p>
              <p className="text-sm text-foreground">SMS & email reminders</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg border border-border bg-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              Today&apos;s brief
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between rounded-md border border-border bg-background/40 px-4 py-2.5">
              <span>Visits scheduled</span>
              <span className="text-base font-semibold text-foreground">8</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-background/40 px-4 py-2.5">
              <span>Waitlist matches</span>
              <span className="text-base font-semibold text-foreground">3</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-background/40 px-4 py-2.5">
              <span>Payout alerts</span>
              <span className="text-base font-semibold text-emerald-600">Clear</span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dashboardHighlights.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="rounded-lg border border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                  {item.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-2xl font-semibold text-foreground">{item.value}</p>
                <CardDescription>{item.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <AvailabilityPlanner doctorId={doctorId} clinicName={clinic?.name} />

        <div className="space-y-6">
          <WaitlistConsole />
          <ConsultationQueue />

          <Card className="rounded-lg border border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                Clinic checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {clinicTasks.map((task) => (
                <div key={task.title} className="flex items-start justify-between gap-3 rounded-md border border-border bg-background/40 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.description}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="px-3 text-xs" asChild>
                    <Link href={task.href}>{task.action}</Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </DoctorShell>
  );
}

