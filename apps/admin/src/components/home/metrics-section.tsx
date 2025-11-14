'use client';

const metrics = [
  { label: 'Clinics live', value: '140+', description: 'across 18 cities' },
  { label: 'Verification SLA', value: '<48h', description: 'avg credential approval' },
  { label: 'Incident compliance', value: '99.4%', description: 'resolved within SLA' },
];

export const MetricsSection = () => {
  return (
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
  );
};
