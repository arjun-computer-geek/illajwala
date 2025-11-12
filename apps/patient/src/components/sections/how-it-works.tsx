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
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,#FFFFFF_0%,#F3FAFC_100%)] py-24 dark:bg-[linear-gradient(135deg,rgba(8,22,28,0.92)_0%,rgba(9,30,40,0.92)_100%)]">
      <div className="absolute inset-x-0 top-0 -z-10 h-48 bg-[radial-gradient(circle_at_top,rgba(32,113,182,0.18),transparent_65%)] dark:bg-[radial-gradient(circle_at_top,rgba(48,214,200,0.14),transparent_60%)]" />
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.32em] text-primary/80">
            Simple patient journey
          </span>
          <h2 className="mt-4 text-3xl font-semibold text-foreground md:text-[2.4rem] md:leading-tight">
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
              className="relative flex h-full flex-col gap-4 rounded-[1.2rem] border border-border/50 bg-white/80 p-8 shadow-[0_20px_48px_-28px_rgba(32,113,182,0.25)] transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_24px_56px_-24px_rgba(32,113,182,0.3)] dark:border-border/40 dark:bg-background/70"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-accent/80 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              <div className="mt-auto pt-6">
                <div className="h-[3px] w-16 rounded-full bg-primary/70" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

