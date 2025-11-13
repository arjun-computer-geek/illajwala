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
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,#FBFEFE_0%,#F1FAFB_100%)] py-24 dark:bg-[linear-gradient(135deg,rgba(12,17,22,0.95)_0%,rgba(16,34,46,0.92)_100%)]">
      <div className="absolute inset-x-0 top-0 -z-10 h-48 bg-[radial-gradient(circle_at_top,rgba(44,167,163,0.15),transparent_65%)] dark:bg-[radial-gradient(circle_at_top,rgba(61,190,133,0.18),transparent_60%)]" />
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
              className="relative flex h-full flex-col gap-4 rounded-3xl border border-white/60 bg-white/90 p-8 shadow-[0_26px_60px_-28px_rgba(30,144,187,0.28)] transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_34px_80px_-28px_rgba(30,144,187,0.32)] dark:border-border/40 dark:bg-secondary/70"
            >
              <span
                className="flex size-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(44,167,163,0.25),rgba(30,144,187,0.45))] text-sm font-semibold uppercase tracking-[0.3em] text-primary"
                style={{ fontFamily: "var(--font-illajwala-mono)" }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              <div className="mt-auto pt-6">
                <div className="h-[3px] w-16 rounded-full bg-[linear-gradient(135deg,#2CA7A3_0%,#1E90BB_100%)]" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

