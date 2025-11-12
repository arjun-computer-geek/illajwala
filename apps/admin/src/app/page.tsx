"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@illajwala/ui";
import { useAdminAuth } from "../hooks/use-auth";

const tasks = [
  {
    title: "Clinic Onboarding",
    description:
      "Review documentation, assign tenant IDs, and activate subdomains within minutes.",
  },
  {
    title: "Quality & Compliance",
    description:
      "Track verification status, audit logs, and consent artefacts to stay launch-ready.",
  },
  {
    title: "Operational Insights",
    description:
      "Monitor booking conversion, cancellations, and provider performance at a glance.",
  },
];

export default function AdminHome() {
  const { isAuthenticated, admin, clearAuth } = useAdminAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-brand-gradient px-6 py-24">
      <div className="mx-auto flex max-w-5xl flex-col gap-12 rounded-3xl bg-card p-12 text-center shadow-brand-card">
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
            <p className="text-sm uppercase tracking-[0.3em] text-primary">Platform Administration</p>
            <h1 className="mt-4 text-4xl font-semibold text-foreground sm:text-5xl">
              Keep every clinic trusted and operational
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Manage onboarding pipelines, verify credentials, and monitor platform health from a
              single command center built for Illajwala ops teams.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            {isAuthenticated ? (
              <>
                <Button asChild className="rounded-full px-6 py-3">
                  <Link href="/dashboard">Go to dashboard</Link>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full px-6 py-3"
                  onClick={clearAuth}
                >
                  Sign out {admin ? `(${admin.email})` : ""}
                </Button>
              </>
            ) : (
              <Button asChild className="rounded-full px-6 py-3">
                <Link href="/auth/login">Admin sign in</Link>
              </Button>
            )}
            <Link
              href="/checklists"
              className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:border-primary/60 hover:text-primary"
            >
              Launch readiness checklist
            </Link>
          </div>
        </div>

        <div className="grid gap-6 text-left sm:grid-cols-3">
          {tasks.map((task) => (
            <div
              key={task.title}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-background/60 p-6 backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <h3 className="text-lg font-semibold text-foreground">{task.title}</h3>
              <p className="text-sm text-muted-foreground">{task.description}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 text-left">
          <h2 className="text-base font-semibold text-primary">Live roadmap</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Upcoming sprints add provider QA workflows, automated Razorpay reconciliation, and
            clinic-level insights in line with the master PRD.
          </p>
        </div>
      </div>
    </main>
  );
}

