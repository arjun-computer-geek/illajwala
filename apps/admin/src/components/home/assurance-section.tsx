'use client';

import Link from 'next/link';
import { AlertTriangle, ClipboardCheck, Workflow } from 'lucide-react';
import { Button } from '@illajwala/ui';

const assuranceHighlights = [
  {
    title: 'Policy-backed safeguards',
    description:
      'Mandate maker-checker flows, immutable audit logs, and field-level masking for all PHI events.',
    icon: ClipboardCheck,
  },
  {
    title: 'Issue intelligence',
    description:
      'Adaptive alerts classify risk, recommend next steps, and notify the right squad instantly.',
    icon: AlertTriangle,
  },
  {
    title: 'Ops playbooks',
    description:
      'Templatise reconciliations, compliance audits, and DR drills with workflows that scale.',
    icon: Workflow,
  },
];

export const AssuranceSection = () => {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0B2330_0%,#114062_55%,#1CA4A3_120%)] py-24 text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.16),transparent_65%)]" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center md:max-w-3xl md:text-left">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/75">
            Governance you can trust
          </span>
          <h2 className="mt-4 text-3xl font-semibold md:text-[2.3rem] md:leading-tight">
            Safeguards, alerts, and playbooks tailored for rapid growth
          </h2>
          <p className="mt-4 text-base text-white/80 md:text-lg">
            Whether you&apos;re scaling to new regions or launching speciality lines, the admin
            console keeps quality uncompromised.
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
              Ready for a deeper dive?
            </p>
            <p className="text-base text-white/85">
              Request a governance workshop tailored to your clinic network.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              variant="outline"
              className="border-white/50 text-white hover:bg-white/20"
            >
              <Link href="/demo">Book strategy session</Link>
            </Button>
            <Button asChild variant="secondary" className="bg-white text-primary hover:bg-white/90">
              <Link href="/docs/admin-ops-kit.pdf">Download ops kit</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
