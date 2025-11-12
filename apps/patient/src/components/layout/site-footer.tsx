import Image from "next/image";
import Link from "next/link";
import { Container } from "./container";

const patientLinks = [
  { label: "Find Doctors", href: "/search" },
  { label: "Book Appointments", href: "/search" },
  { label: "Health Records", href: "/account/records" },
  { label: "Reviews", href: "/reviews" },
];

const doctorLinks = [
  { label: "Join Network", href: "https://illajwala.com/join" },
  { label: "Practice Management", href: "/product/practice" },
  { label: "Patient Analytics", href: "/product/analytics" },
  { label: "Support", href: "/support" },
];

const companyLinks = [
  { label: "About Us", href: "/about" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy" },
];

export const SiteFooter = () => {
  return (
    <footer className="bg-[hsl(var(--primary))] text-white dark:bg-[hsl(var(--brand-hero-from))] dark:text-foreground">
      <Container className="relative py-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom_left,hsl(var(--brand-hero-to))/0.25,transparent_55%)] dark:bg-[radial-gradient(circle_at_top_right,hsl(var(--primary))/0.18,transparent_55%)]" />
        <div className="grid gap-12 md:grid-cols-[1.3fr_repeat(3,minmax(0,1fr))]">
          <div className="space-y-5">
            <Link href="/" className="group flex items-center gap-4">
              <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/10 p-2 shadow-[0_18px_45px_-20px_rgba(15,23,42,0.65)] backdrop-blur-sm transition-all group-hover:scale-[1.04] dark:bg-card/80 dark:shadow-[0_20px_50px_-24px_rgba(5,14,30,0.75)]">
                <Image src="/logo.png" alt="illajwala logo" fill sizes="48px" className="object-contain" />
              </span>
              <div className="leading-tight">
                <p className="text-xs font-semibold uppercase tracking-[0.45em] text-white/80 dark:text-muted-foreground/80">
                  illajwala
                </p>
              </div>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-white/80 dark:text-muted-foreground">
              Discover trusted specialists, compare real-time availability, and confirm your visit
              in minutes—whether it&apos;s in-clinic, telehealth, or at home.
            </p>
            <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.35em]">
              <span className="rounded-full bg-white/10 px-3 py-1 text-white/80 shadow-[0_12px_32px_-18px_rgba(15,23,42,0.45)] dark:bg-primary/10 dark:text-primary-foreground/80 dark:ring-1 dark:ring-primary/30">
                Clinic · Telehealth · Home
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-white/80 shadow-[0_12px_32px_-18px_rgba(15,23,42,0.45)] dark:bg-primary/10 dark:text-primary-foreground/80 dark:ring-1 dark:ring-primary/30">
                24/7 Concierge
              </span>
            </div>
          </div>
          <FooterColumn title="Patients" links={patientLinks} />
          <FooterColumn title="Doctors" links={doctorLinks} />
          <FooterColumn title="Company" links={companyLinks} />
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-4 pt-6 text-xs font-medium uppercase tracking-[0.3em] text-white/70 shadow-[0_-18px_40px_-26px_rgba(15,23,42,0.6)] dark:text-muted-foreground/80 dark:shadow-[0_-22px_46px_-28px_rgba(2,6,23,0.8)] md:flex-row">
          <span>© {new Date().getFullYear()} illajwala Health Pvt. Ltd.</span>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="transition hover:text-white dark:hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-white dark:hover:text-foreground">
              Terms
            </Link>
            <Link href="/contact" className="transition hover:text-white dark:hover:text-foreground">
              Support
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
};

const FooterColumn = ({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) => (
  <div className="space-y-4">
    <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60 dark:text-muted-foreground/70">
      {title}
    </h3>
    <ul className="space-y-2 text-sm text-white/80 dark:text-muted-foreground/90">
      {links.map((link) => (
        <li key={link.label}>
          <Link
            href={link.href}
            className="transition-colors hover:text-white dark:hover:text-foreground"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

