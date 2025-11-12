import { Container } from "@/components/layout/container";

const steps = [
  {
    title: "Tell us your need",
    description: "Search by symptom, specialty, or doctor name and filter by insurance, language, or consultation mode.",
  },
  {
    title: "Compare availability",
    description: "See real-time slots, wait times, and verified reviews to pick what works best for your schedule.",
  },
  {
    title: "Book and manage",
    description: "Confirm in-clinic or virtual visits, get reminders, and reschedule or cancel in a few taps.",
  },
];

export const HowItWorksSection = () => {
  return (
    <section className="relative overflow-hidden bg-[hsl(var(--secondary))] py-24 dark:bg-[hsl(var(--background))]">
      <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-linear-to-b from-[hsl(var(--primary))/0.18] via-transparent to-transparent dark:from-[hsl(var(--primary))/0.25]" />
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">
            Simple patient journey
          </span>
          <h2 className="mt-4 text-3xl font-bold text-foreground md:text-[2.4rem] md:leading-tight">
            How illajwala works
          </h2>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            Stay informed at every step with an experience designed for clarity, confidence, and
            compassion.
          </p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative flex h-full flex-col rounded-3xl bg-white/95 p-8 shadow-xl shadow-primary/10 transition-transform duration-200 hover:-translate-y-1 hover:shadow-brand-card dark:bg-card/90 dark:shadow-[0_28px_62px_-30px_rgba(2,6,23,0.85)] dark:ring-1 dark:ring-primary/25"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-sm font-semibold uppercase tracking-[0.3em] text-primary dark:bg-primary/20">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-6 text-xl font-semibold text-foreground">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              <div className="mt-auto pt-6">
                <div className="h-[3px] w-14 rounded-full bg-primary/60" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

