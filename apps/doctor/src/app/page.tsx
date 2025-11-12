"use client";

import Image from "next/image";
import Link from "next/link";

const cards = [
  {
    title: "Manage Schedules",
    description:
      "Create recurring availability, block time off, and sync calendars across providers.",
  },
  {
    title: "Track Appointments",
    description:
      "Confirm, reschedule, or cancel visits with real-time patient notifications.",
  },
  {
    title: "Coordinate Staff",
    description:
      "Invite receptionists and care coordinators with role-based permissions.",
  },
];

export default function DoctorHome() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-brand-gradient px-6 py-24">
      <div className="mx-auto flex max-w-4xl flex-col gap-12 rounded-3xl bg-card p-12 text-center shadow-brand-card">
        <div className="flex flex-col items-center gap-6">
          <Image
            src="/logo.png"
            alt="Illajwala"
            width={120}
            height={120}
            className="h-16 w-16 object-contain"
            priority
          />
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-primary">
              Illajwala Doctor Hub
            </p>
            <h1 className="mt-4 text-4xl font-semibold text-foreground sm:text-5xl">
              Run your clinic on autopilot
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Publish slots, manage appointments, and stay on top of patient care with an
              all-in-one workspace tailored for Illajwala clinics.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Sign in to clinic portal
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:border-primary/60 hover:text-primary"
            >
              Onboard a new clinic
            </Link>
          </div>
        </div>

        <div className="grid gap-6 text-left sm:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.title}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-background/60 p-6 backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <h3 className="text-lg font-semibold text-foreground">{card.title}</h3>
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 text-left">
          <h2 className="text-base font-semibold text-primary">What&apos;s next?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Over the next sprints we will add staff management, slot locking with Redis, and
            Razorpay payout visibility following the PRD roadmap.
          </p>
        </div>
      </div>
    </main>
  );
}

