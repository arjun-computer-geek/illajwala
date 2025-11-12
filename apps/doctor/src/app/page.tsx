"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarCheck2,
  Clock3,
  Stethoscope,
  Users,
  ShieldCheck,
  Headset,
} from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@illajwala/ui";

const metrics = [
  { label: "Slots auto-confirmed", value: "92%", description: "avg. same-day bookings" },
  { label: "Clinics onboarded", value: "180+", description: "active across India" },
  { label: "Staff invites", value: "5 min", description: "to set permissions" },
];

const featureHighlights = [
  {
    title: "Availability that stays synced",
    description:
      "Mirror your in-clinic calendar, buffer travel time, and automate telehealth slot releases.",
    icon: CalendarCheck2,
  },
  {
    title: "Patient updates, not manual calls",
    description:
      "Trigger reminders, confirmations, and follow-up notes without leaving the doctor hub.",
    icon: Users,
  },
  {
    title: "Staff access that just works",
    description:
      "Invite care coordinators with scoped roles so receptionists see what they need—nothing more.",
    icon: BadgeCheck,
  },
];

const workflowSteps = [
  {
    title: "Define your visit templates",
    description:
      "Set slot lengths, consult types, and allowed modes once. Illajwala mirrors it across channels.",
  },
  {
    title: "Sync calendars & publish",
    description:
      "Connect Google Calendar or upload schedules. Auto-hold buffers keep diaries accurate.",
  },
  {
    title: "Track performance live",
    description:
      "View conversion, no-show rate, and payout visibility from a real-time cockpit.",
  },
];

const assuranceHighlights = [
  {
    title: "Secure by design",
    description:
      "Multi-tenant data isolation, role-based access, and audited changes ensure clinical governance.",
    icon: ShieldCheck,
  },
  {
    title: "Concierge support",
    description:
      "Dedicated partner success with <5 min median responses for operational or technical escalations.",
    icon: Headset,
  },
  {
    title: "Smart waitlist routing",
    description:
      "Auto-suggest next best slots to patients when you release availability, driving higher utilisation.",
    icon: Clock3,
  },
];

export default function DoctorHome() {
  return (
    <main className="bg-background text-foreground">
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#F3FAFC_0%,#E8F7F5_45%,rgba(32,113,182,0.12)_100%)] pb-24 pt-20 dark:bg-[linear-gradient(135deg,rgba(10,28,36,0.95)_0%,rgba(12,32,45,0.9)_60%,rgba(16,52,70,0.85)_100%)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_top_left,rgba(28,164,163,0.32),transparent_60%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(48,214,200,0.25),transparent_60%)]" />
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 sm:px-6 lg:px-8">
          <header className="flex flex-col items-center justify-between gap-6 rounded-[1.4rem] border border-white/60 bg-white/70 px-6 py-4 text-xs font-semibold uppercase tracking-[0.32em] text-primary shadow-[0_16px_44px_-26px_rgba(32,113,182,0.28)] backdrop-blur-md dark:border-white/10 dark:bg-background/60 lg:flex-row lg:text-[0.65rem]">
            <span>Illajwala Doctor Hub</span>
            <div className="flex items-center gap-3 text-[0.65rem] text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-primary">
                <Stethoscope className="h-3.5 w-3.5" />
                Clinic · Telehealth · Outreach
              </span>
              <span>Designed for busy care teams</span>
            </div>
          </header>

          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="space-y-8 text-center lg:text-left">
              <div className="space-y-6">
                <h1 className="text-4xl font-semibold leading-tight md:text-[3.1rem] md:leading-[1.05]">
                  Run every clinic day with{" "}
                  <span className="bg-[linear-gradient(135deg,#1CA4A3_0%,#2071B6_100%)] bg-clip-text text-transparent">
                    calm control
                  </span>
                </h1>
                <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
                  Keep schedules synchronised, automate patient nudges, and give your staff a single
                  source of truth—without spreadsheets or phone tag.
                </p>
              </div>

              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-start">
                <Button asChild className="px-7 text-base">
                  <Link href="/auth/login">Sign in to doctor hub</Link>
                </Button>
                <Button asChild variant="outline" className="px-6 text-base">
                  <Link href="/onboarding">Onboard a new clinic</Link>
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground lg:justify-start">
                <span className="rounded-full border border-border/60 bg-white/70 px-4 py-2">
                  Auto-sync calendars
                </span>
                <span className="rounded-full border border-border/60 bg-white/70 px-4 py-2">
                  Razorpay payouts
                </span>
                <span className="rounded-full border border-border/60 bg-white/70 px-4 py-2">
                  Care team roles
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="rounded-[1.6rem] border border-border/50 bg-white/80 p-5 shadow-[0_34px_80px_-32px_rgba(32,113,182,0.32)] backdrop-blur-xl dark:border-border/40 dark:bg-background/70">
                <div className="rounded-[1.4rem] bg-[linear-gradient(150deg,rgba(28,164,163,0.16)_0%,rgba(32,113,182,0.12)_100%)] p-5">
                  <Image
                    src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80"
                    alt="Doctor coordinating with clinic staff"
                    width={720}
                    height={640}
                    className="h-[360px] w-full rounded-[1.2rem] object-cover"
                    priority
                  />
                </div>
                <Card className="absolute -bottom-10 left-1/2 w-[86%] -translate-x-1/2 border border-border/60 bg-white/90 px-6 py-5 shadow-[0_26px_56px_-26px_rgba(32,113,182,0.32)] backdrop-blur-xl dark:border-border/40 dark:bg-background/85">
                  <CardHeader className="space-y-3 p-0">
                    <CardTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-primary/80">
                      Live occupancy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-6 p-0">
                    <div>
                      <p className="text-2xl font-semibold">12/14 slots</p>
                      <p className="text-sm text-muted-foreground">
                        Thursday · Downtown OPD
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground/80">
                        next slot
                      </p>
                      <p className="text-sm text-foreground">04:30 PM · Telehealth</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-24 dark:bg-background">
        <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 text-center sm:grid-cols-3 sm:text-left">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-[1.2rem] border border-border/60 bg-white/80 p-6 shadow-[0_20px_50px_-30px_rgba(32,113,182,0.28)] dark:border-border/40 dark:bg-background/70"
            >
              <div className="text-3xl font-semibold text-foreground">{metric.value}</div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                {metric.label}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{metric.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[hsl(var(--background))] py-24 dark:bg-[hsl(var(--background))]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto text-center md:max-w-3xl">
            <span className="text-xs font-semibold uppercase tracking-[0.32em] text-primary/80">
              Clinic operating system
            </span>
            <h2 className="mt-4 text-3xl font-semibold md:text-[2.4rem] md:leading-tight">
              Everything your care team needs—without juggling tools
            </h2>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              From slot planning to payout clarity, Illajwala centralises your day-to-day so
              providers can stay focused on patient outcomes.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {featureHighlights.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="h-full border border-border/60 bg-white/85 p-6 text-left shadow-[0_22px_58px_-32px_rgba(32,113,182,0.3)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_26px_64px_-28px_rgba(32,113,182,0.32)] dark:border-border/40 dark:bg-background/75"
                >
                  <CardHeader className="p-0">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="mt-6 text-xl font-semibold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="mt-4 p-0 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-white py-24 dark:bg-background">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div className="space-y-6">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">
                Clinic playbook
              </span>
              <h2 className="text-3xl font-semibold md:text-[2.3rem] md:leading-tight">
                A workflow that adapts to your practice—not the other way around
              </h2>
              <p className="text-base text-muted-foreground md:text-lg">
                Every Illajwala clinic gets a dedicated implementation specialist to mirror your
                existing SOP, so you can launch without disrupting patient care.
              </p>
            </div>

            <div className="space-y-6">
              {workflowSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="flex gap-5 rounded-[1.2rem] border border-border/60 bg-white/85 p-6 shadow-[0_22px_58px_-32px_rgba(32,113,182,0.28)] dark:border-border/40 dark:bg-background/70"
                >
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/12 text-sm font-semibold uppercase tracking-[0.28em] text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0B2330_0%,#114062_55%,#1CA4A3_120%)] py-24 text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.16),transparent_65%)]" />
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center md:max-w-3xl md:text-left">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/75">
              Confidence to scale
            </span>
            <h2 className="mt-4 text-3xl font-semibold md:text-[2.3rem] md:leading-tight">
              Built with safeguards, support, and insights for growth-ready clinics
            </h2>
            <p className="mt-4 text-base text-white/80 md:text-lg">
              No matter the size of your practice, we keep operations compliant and responsive so
              your patients never feel the growing pains.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {assuranceHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex h-full flex-col rounded-[1.2rem] border border-white/20 bg-white/10 p-6 backdrop-blur-sm"
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-6 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm text-white/80">{item.description}</p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col items-center justify-between gap-6 rounded-[1.2rem] border border-white/20 bg-white/10 px-8 py-6 backdrop-blur-sm md:flex-row">
            <div className="space-y-1 text-center md:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                Need a walkthrough?
              </p>
              <p className="text-base text-white/85">
                Schedule a 20-minute clinic ops audit and see your launch plan.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="outline" className="border-white/50 text-white hover:bg-white/20">
                <Link href="/demo">Book a demo</Link>
              </Button>
              <Button asChild variant="secondary" className="bg-white text-primary hover:bg-white/90">
                <Link href="/docs/doctor-playbook.pdf">Download playbook</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

