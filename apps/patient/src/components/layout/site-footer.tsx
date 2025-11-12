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
    <footer className="bg-[linear-gradient(135deg,#0B2330_0%,#114062_55%,#1CA4A3_120%)] text-white">
      <Container className="relative py-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_65%)]" />
        <div className="grid gap-12 md:grid-cols-[1.3fr_repeat(3,minmax(0,1fr))]">
          <div className="space-y-5">
            <Link href="/" className="group flex items-center gap-4">
              <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[1.2rem] bg-white/10 p-2 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.4)] backdrop-blur-[6px] transition-transform duration-200 group-hover:-translate-y-0.5">
                <Image src="/logo.png" alt="illajwala logo" fill sizes="48px" className="object-contain" />
              </span>
              <div className="leading-tight">
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/80">
                  illajwala
                </p>
              </div>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-white/75">
              Discover trusted specialists, compare real-time availability, and confirm your visit
              in minutes—whether it&apos;s in-clinic, telehealth, or at home.
            </p>
            <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.32em] text-white/75">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
                Clinic · Telehealth · Home
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
                24/7 Concierge
              </span>
            </div>
          </div>
          <FooterColumn title="Patients" links={patientLinks} />
          <FooterColumn title="Doctors" links={doctorLinks} />
          <FooterColumn title="Company" links={companyLinks} />
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/15 pt-6 text-xs font-medium uppercase tracking-[0.28em] text-white/70 md:flex-row">
          <span>© {new Date().getFullYear()} illajwala Health Pvt. Ltd.</span>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="transition hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>
            <Link href="/contact" className="transition hover:text-white">
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
    <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
      {title}
    </h3>
    <ul className="space-y-2 text-sm text-white/75">
      {links.map((link) => (
        <li key={link.label}>
          <Link
            href={link.href}
            className="transition-colors hover:text-white"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

