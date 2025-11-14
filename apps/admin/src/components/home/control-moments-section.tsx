'use client';

const controlMoments = [
  {
    title: 'Monitor live health',
    description:
      'Surface conversion dips, wait time spikes, or payout anomalies from a real-time dashboard.',
  },
  {
    title: 'Run launch rituals',
    description:
      'Use ready-made checklists to move clinics from sandbox to production without missing dependencies.',
  },
  {
    title: 'Escalate with clarity',
    description:
      'Automated incident briefs package context, stakeholders, and remediation timers for fast alignment.',
  },
];

export const ControlMomentsSection = () => {
  return (
    <section className="overflow-hidden bg-white py-24 dark:bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div className="space-y-6">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">
              Rhythm of ops
            </span>
            <h2 className="text-3xl font-semibold md:text-[2.3rem] md:leading-tight">
              Stay ahead of risks with calm, predictable rituals
            </h2>
            <p className="text-base text-muted-foreground md:text-lg">
              Purpose-built workflows bring together data, documentation, and decisions—so Illajwala
              clinics launch fast and stay compliant.
            </p>
          </div>

          <div className="space-y-6">
            {controlMoments.map((moment, index) => (
              <div
                key={moment.title}
                className="flex gap-5 rounded-[1.2rem] border border-border/60 bg-white/85 p-6 shadow-[0_22px_58px_-32px_rgba(32,113,182,0.28)] dark:border-border/40 dark:bg-background/70"
              >
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/12 text-sm font-semibold uppercase tracking-[0.28em] text-primary">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{moment.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {moment.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
