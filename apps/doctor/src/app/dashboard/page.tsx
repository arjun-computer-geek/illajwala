"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@illajwala/ui";
import {
  Activity,
  Bell,
  CalendarClock,
  ClipboardCheck,
  MapPin,
  Settings,
} from "lucide-react";
import { AvailabilityPlanner } from "../../components/availability/availability-planner";
import { useDoctorAuth } from "../../hooks/use-auth";

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

const upcomingVisits = [
  {
    patient: "Arjun Patel",
    reason: "Hypertension follow-up",
    time: "09:00 AM",
    mode: "Clinic visit",
  },
  {
    patient: "Riya Sharma",
    reason: "Dermatology consult",
    time: "11:30 AM",
    mode: "Telehealth",
  },
  {
    patient: "Sameer Khan",
    reason: "First-time evaluation",
    time: "02:15 PM",
    mode: "Clinic visit",
  },
];

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="h-32 animate-pulse rounded-3xl bg-muted/40" />
    <div className="grid gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-32 rounded-2xl" />
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Skeleton className="h-[520px] rounded-2xl" />
      <div className="space-y-4">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  </div>
);

export default function DoctorDashboardPage() {
  const router = useRouter();
  const { doctor, hydrated, isAuthenticated } = useDoctorAuth();

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/auth/login?redirectTo=/dashboard");
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated) {
    return (
      <main className="bg-muted/30 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <DashboardSkeleton />
        </div>
      </main>
    );
  }

  if (!doctor || !isAuthenticated) {
    return null;
  }

  const clinic = doctor.clinicLocations?.[0];
  const doctorId = doctor._id ?? "unknown";

  return (
    <main className="bg-muted/30 pb-16 pt-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6">
        <header className="rounded-3xl border border-border/70 bg-white/95 p-8 shadow-[0_38px_96px_-36px_rgba(32,113,182,0.35)] backdrop-blur-xl dark:border-border/40 dark:bg-background/85">
          <div className="flex flex-col gap-7 md:flex-row md:items-start md:justify-between">
            <div className="space-y-4">
              <Badge variant="outline" className="rounded-full border-primary/40 bg-primary/10 px-4 py-2 text-xs uppercase tracking-[0.32em] text-primary">
                Doctor hub
              </Badge>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Good day, Dr. {doctor.name.split(" ")[0]}
                </h1>
                <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
                  Keep operations steady: publish clinic slots, monitor upcoming visits, and action launch checklists for your care team.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
                {clinic?.city ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/80 px-4 py-2">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {clinic.city}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/80 px-4 py-2">
                  <Settings className="h-3.5 w-3.5 text-primary" />
                  Availability drafts
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/80 px-4 py-2">
                  <Bell className="h-3.5 w-3.5 text-primary" />
                  Patient nudges enabled
                </span>
              </div>
              <div>
                <Button asChild variant="outline" className="rounded-full px-6 text-xs uppercase tracking-[0.28em]">
                  <Link href="/profile">Update profile</Link>
                </Button>
              </div>
            </div>
            <Card className="max-w-sm border border-border/70 bg-white/90 shadow-none dark:border-border/40 dark:bg-background/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-[0.32em] text-primary/80">
                  Today&apos;s brief
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between rounded-xl border border-border/50 bg-white/80 px-4 py-3 dark:bg-background/70">
                  <span>Visits scheduled</span>
                  <span className="text-base font-semibold text-foreground">8</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/50 bg-white/80 px-4 py-3 dark:bg-background/70">
                  <span>Waitlist matches</span>
                  <span className="text-base font-semibold text-foreground">3</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/50 bg-white/80 px-4 py-3 dark:bg-background/70">
                  <span>Payout alerts</span>
                  <span className="text-base font-semibold text-emerald-500">Clear</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {dashboardHighlights.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className="border border-border/60 bg-white/90 px-6 py-5 shadow-[0_28px_70px_-36px_rgba(32,113,182,0.28)] transition hover:-translate-y-1 dark:border-border/40 dark:bg-background/80"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    {item.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-3xl font-semibold text-foreground">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <AvailabilityPlanner doctorId={doctorId} clinicName={clinic?.name} />

          <div className="space-y-6">
            <Card className="border border-border/60 bg-white/95 shadow-[0_30px_72px_-38px_rgba(32,113,182,0.3)] dark:border-border/40 dark:bg-background/85">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Upcoming visits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingVisits.map((visit) => (
                  <div
                    key={`${visit.patient}-${visit.time}`}
                    className="flex flex-col gap-2 rounded-xl border border-border/50 bg-white/90 px-4 py-3 text-sm dark:border-border/40 dark:bg-background/70"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground">{visit.patient}</span>
                      <span className="text-xs uppercase tracking-[0.28em] text-muted-foreground">{visit.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{visit.reason}</p>
                    <Badge variant="outline" className="w-fit rounded-full border-primary/40 bg-primary/10 text-[10px] uppercase tracking-[0.28em] text-primary">
                      {visit.mode}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border border-border/60 bg-white/95 shadow-[0_30px_72px_-38px_rgba(32,113,182,0.3)] dark:border-border/40 dark:bg-background/85">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Clinic checklist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {clinicTasks.map((task) => (
                  <div key={task.title} className="flex items-start justify-between gap-3 rounded-xl border border-border/50 bg-white/90 px-4 py-3 text-sm dark:border-border/40 dark:bg-background/70">
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
      </div>
    </main>
  );
}

