'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@illajwala/ui';
import { useAdminAuth } from '../../hooks/use-auth';

export const HeroSection = () => {
  const { isAuthenticated, admin, clearAuth } = useAdminAuth();

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,#F3FAFC_0%,#E7F5F3_45%,rgba(32,113,182,0.12)_100%)] pb-24 pt-20 dark:bg-[linear-gradient(135deg,rgba(10,28,36,0.95)_0%,rgba(12,32,45,0.88)_60%,rgba(16,52,70,0.85)_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_top_left,rgba(28,164,163,0.32),transparent_60%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(48,214,200,0.22),transparent_60%)]" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 sm:px-6 lg:px-8">
        <header className="flex flex-col items-center justify-between gap-6 rounded-[1.4rem] border border-white/60 bg-white/70 px-6 py-4 text-xs font-semibold uppercase tracking-[0.32em] text-primary shadow-[0_16px_44px_-26px_rgba(32,113,182,0.28)] backdrop-blur-md dark:border-white/10 dark:bg-background/60 lg:flex-row lg:text-[0.65rem]">
          <span>Illajwala Admin Console</span>
          <div className="flex items-center gap-3 text-[0.65rem] text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Trust · Governance · Insights
            </span>
            <span>Built for operations & compliance leads</span>
          </div>
        </header>

        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-8 text-center lg:text-left">
            <div className="space-y-6">
              <h1 className="text-4xl font-semibold leading-tight md:text-[3.05rem] md:leading-[1.05]">
                Keep every Illajwala clinic{' '}
                <span className="bg-[linear-gradient(135deg,#1CA4A3_0%,#2071B6_100%)] bg-clip-text text-transparent">
                  launch-ready
                </span>
              </h1>
              <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
                Orchestrate onboarding, credentialing, and operational oversight from a calm,
                centralised command centre made for rapid scale.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-start">
              {isAuthenticated ? (
                <>
                  <Button asChild className="px-7 text-base">
                    <Link href="/dashboard">Go to admin dashboard</Link>
                  </Button>
                  <Button variant="outline" className="px-6 text-base" onClick={() => clearAuth()}>
                    Sign out {admin ? `(${admin.email})` : ''}
                  </Button>
                </>
              ) : (
                <Button asChild className="px-7 text-base">
                  <Link href="/auth/login">Admin sign in</Link>
                </Button>
              )}
              <Button asChild variant="outline" className="px-6 text-base">
                <Link href="/checklists">Launch readiness checklist</Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground lg:justify-start">
              <span className="rounded-full border border-border/60 bg-white/70 px-4 py-2">
                Tenant activation
              </span>
              <span className="rounded-full border border-border/60 bg-white/70 px-4 py-2">
                Credential audits
              </span>
              <span className="rounded-full border border-border/60 bg-white/70 px-4 py-2">
                Live health signals
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="rounded-[1.6rem] border border-border/50 bg-white/80 p-5 shadow-[0_34px_80px_-32px_rgba(32,113,182,0.32)] backdrop-blur-xl dark:border-border/40 dark:bg-background/70">
              <div className="rounded-[1.4rem] bg-[linear-gradient(150deg,rgba(28,164,163,0.16)_0%,rgba(32,113,182,0.12)_100%)] p-5">
                <Image
                  src="https://images.unsplash.com/photo-1582719478457-5f19b0c714c6?auto=format&fit=crop&w=900&q=80"
                  alt="Admin team coordinating Illajwala clinic launch"
                  width={720}
                  height={640}
                  className="h-[360px] w-full rounded-[1.2rem] object-cover"
                  priority
                />
              </div>
              <Card className="absolute -bottom-10 left-1/2 w-[86%] -translate-x-1/2 border border-border/60 bg-white/90 px-6 py-5 shadow-[0_26px_56px_-26px_rgba(32,113,182,0.32)] backdrop-blur-xl dark:border-border/40 dark:bg-background/85">
                <CardHeader className="space-y-2 p-0">
                  <CardTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-primary/80">
                    Launch tracker
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-6 p-0 text-left">
                  <div>
                    <p className="text-2xl font-semibold">08 clinics</p>
                    <p className="text-sm text-muted-foreground">Go-live within 14 days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground/80">
                      blockers
                    </p>
                    <p className="text-sm text-foreground">2 compliance · 1 finance</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
