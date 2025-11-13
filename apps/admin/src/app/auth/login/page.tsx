"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Separator,
} from "@illajwala/ui";
import { AdminLoginForm } from "../../../components/auth/admin-login-form";

export default function AdminLoginPage() {
  const opsHighlights = useMemo(
    () => [
      {
        title: "Launch visibility",
        description: "Track every clinic&apos;s readiness, unresolved blockers, and owners in one calm view.",
      },
      {
        title: "Governance on rails",
        description: "Enforce maker-checker approvals, credential audits, and immutable activity logs.",
      },
      {
        title: "Incident intelligence",
        description: "Route issues with suggested actions, escalations, and timers that keep response tight.",
      },
    ],
    []
  );

  const opsSignals = useMemo(
    () => [
      { label: "Clinics live", value: "140+" },
      { label: "SLA adherence", value: "99.4%" },
      { label: "Activation pace", value: "<14 days" },
    ],
    []
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#F3FAFC_0%,#E7F6F5_45%,rgba(32,113,182,0.15)_100%)] px-4 py-16 dark:bg-[linear-gradient(135deg,rgba(10,28,36,0.94)_0%,rgba(12,32,45,0.9)_60%,rgba(16,52,70,0.85)_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_top_left,rgba(28,164,163,0.3),transparent_60%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(48,214,200,0.2),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-[-340px] w-[520px] rounded-full bg-[rgba(32,113,182,0.12)] blur-[190px]" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
          <Badge variant="outline" className="rounded-full border-primary/40 bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.32em] text-primary shadow-[0_14px_36px_-24px_rgba(32,113,182,0.35)] backdrop-blur-sm dark:bg-background/60">
            Admin console access
          </Badge>
          <div className="max-w-2xl space-y-3">
            <h1 className="text-3xl font-semibold leading-tight md:text-[2.4rem] md:leading-[1.1]">
              Sign in to keep{" "}
              <span className="bg-[linear-gradient(135deg,#1CA4A3_0%,#2071B6_100%)] bg-clip-text text-transparent">
                every clinic trusted
              </span>
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Orchestrate onboarding, provider verification, and platform health with calm, auditable workflows.
            </p>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
          <Card className="border border-border/60 bg-white/85 shadow-[0_26px_60px_-30px_rgba(32,113,182,0.32)] backdrop-blur-xl dark:border-border/40 dark:bg-background/80">
            <CardHeader className="space-y-4 pb-4 text-center lg:text-left">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-semibold tracking-tight">Welcome back, operator</CardTitle>
                <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                  Use your Illajwala operations credentials to unlock launch rituals, compliance oversight, and real-time insights.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <Suspense
                fallback={
                  <div className="flex h-20 items-center justify-center rounded-lg border border-border/60 bg-muted/20 text-sm text-muted-foreground">
                    Preparing login form…
                  </div>
                }
              >
                <AdminLoginForm />
              </Suspense>

              <Separator />

              <div className="grid gap-3 rounded-[1.2rem] border border-border/60 bg-secondary/50 p-4 text-left text-sm leading-relaxed text-muted-foreground dark:border-border/40 dark:bg-background/60">
                <p className="font-medium text-foreground">Demo credentials</p>
                <div className="grid gap-1 text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Email:</span> ops@illajwala.com
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Password:</span> admin123
                  </p>
                </div>
                <p className="text-xs">
                  Generated via the identity-service seed script. Replace once production admins are provisioned.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 text-center text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-left">
              <p>
                Need help?{" "}
                <Link href="mailto:support@illajwala.com" className="text-primary underline">
                  support@illajwala.com
                </Link>
              </p>
              <Button variant="ghost" asChild className="h-8 px-3 text-xs">
                <Link href="/">Back to admin landing</Link>
              </Button>
            </CardFooter>
          </Card>

          <div className="space-y-6 rounded-[1.4rem] border border-border/60 bg-white/75 p-8 shadow-[0_30px_68px_-32px_rgba(32,113,182,0.3)] backdrop-blur-xl dark:border-border/40 dark:bg-background/75">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary/80">Keep ops calm</p>
              <h2 className="text-xl font-semibold text-foreground">Everything the platform team needs</h2>
            </div>
            <div className="grid gap-5 text-sm text-muted-foreground">
              {opsHighlights.map((item) => (
                <div key={item.title} className="flex flex-col gap-1 rounded-[1.1rem] border border-border/50 bg-white/80 p-4 shadow-[0_16px_34px_-28px_rgba(32,113,182,0.28)] dark:border-border/40 dark:bg-background/70">
                  <span className="text-sm font-semibold text-foreground">{item.title}</span>
                  <span className="text-xs leading-relaxed">{item.description}</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="grid gap-3 sm:grid-cols-3">
              {opsSignals.map((signal) => (
                <div key={signal.label} className="rounded-[1.1rem] border border-border/50 bg-white/70 px-4 py-3 text-center text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground dark:border-border/40 dark:bg-background/60">
                  <div className="text-base font-semibold tracking-tight text-foreground">{signal.value}</div>
                  <div>{signal.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

