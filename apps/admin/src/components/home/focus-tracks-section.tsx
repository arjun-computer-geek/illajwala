'use client';

import { Activity, Building2, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@illajwala/ui';

const focusTracks = [
  {
    title: 'Clinic onboarding',
    description:
      'Track readiness, legal artefacts, and tenant activation from one orchestrated workspace.',
    icon: Building2,
  },
  {
    title: 'Provider governance',
    description:
      'Audit medical licences, manage re-verification cadences, and store digital consent trails.',
    icon: ShieldCheck,
  },
  {
    title: 'Operational intelligence',
    description:
      'Monitor utilisation, cancellations, and payouts to spot trends before they escalate.',
    icon: Activity,
  },
];

export const FocusTracksSection = () => {
  return (
    <section className="bg-[hsl(var(--background))] py-24 dark:bg-[hsl(var(--background))]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto text-center md:max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-[0.32em] text-primary/80">
            Operational command
          </span>
          <h2 className="mt-4 text-3xl font-semibold md:text-[2.4rem] md:leading-tight">
            One place to steward launches, compliance, and growth
          </h2>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            Coordinate specialist onboarding, enforce governance, and see the pulse of every
            clinic—without spreadsheets or scattered threads.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {focusTracks.map((track) => {
            const Icon = track.icon;
            return (
              <Card
                key={track.title}
                className="h-full border border-border/60 bg-white/85 p-6 text-left shadow-[0_22px_58px_-32px_rgba(32,113,182,0.3)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_26px_64px_-28px_rgba(32,113,182,0.32)] dark:border-border/40 dark:bg-background/75"
              >
                <CardHeader className="p-0">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="mt-6 text-xl font-semibold">{track.title}</CardTitle>
                </CardHeader>
                <CardContent className="mt-4 p-0 text-sm leading-relaxed text-muted-foreground">
                  {track.description}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
