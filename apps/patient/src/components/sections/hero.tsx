"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CalendarHeart, MapPin, Search } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { doctorsApi } from "@/lib/api/doctors";
import { queryKeys } from "@/lib/query-keys";
import type { Doctor, DoctorAvailability } from "@/types/api";

const slotTimeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

const slotDayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const getSlotDisplay = (slot?: string | null) => {
  if (!slot) {
    return null;
  }

  const date = new Date(slot);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const dayLabel = isToday ? "Today" : slotDayFormatter.format(date);
  const timeLabel = slotTimeFormatter.format(date);

  return { dayLabel, timeLabel };
};

export const HeroSection = () => {
  const router = useRouter();

  const {
    data: specialtiesData = [],
    isLoading: isLoadingSpecialties,
  } = useQuery({
    queryKey: queryKeys.doctorSpecialties,
    queryFn: doctorsApi.listSpecialties,
    staleTime: 60 * 60 * 1000,
  });

  const {
    data: featuredDoctorsResponse,
    isLoading: isLoadingFeaturedDoctor,
  } = useQuery({
    queryKey: queryKeys.doctors({ featured: true, pageSize: 1, sort: "rating" }),
    queryFn: () => doctorsApi.list({ featured: true, pageSize: 1, sort: "rating" }),
    staleTime: 2 * 60 * 1000,
  });

  const heroDoctor = featuredDoctorsResponse?.data?.[0];

  const {
    data: availability,
    isLoading: isLoadingAvailability,
  } = useQuery({
    queryKey: heroDoctor
      ? queryKeys.doctorAvailability(heroDoctor._id, { days: 7 })
      : ["doctor-availability", "pending"] as const,
    queryFn: () => doctorsApi.getAvailability(heroDoctor!._id, { days: 7 }),
    enabled: Boolean(heroDoctor),
    staleTime: 60 * 1000,
  });

  const specialties = useMemo(
    () =>
      specialtiesData
        .map((item) => item.trim())
        .filter((item): item is string => item.length > 0)
        .slice(0, 8),
    [specialtiesData]
  );

  const specialtiesCount = specialtiesData.length;
  const totalFeatured = featuredDoctorsResponse?.meta?.total ?? 0;
  const supportedModes = availability?.modes ?? [];
  const supportedModesKey = supportedModes.join("|");

  const highlightPills = useMemo(() => {
    const pills: string[] = [];

    if (totalFeatured > 0) {
      pills.push(`${totalFeatured} top-rated doctors`);
    }

    if (specialtiesCount > 0) {
      pills.push(`${specialtiesCount} specialties on illajwala`);
    }

    if (supportedModes.length > 0) {
      pills.push(`${supportedModes.map((mode) => mode.replace("-", " ")).join(" • ")} supported`);
    }

    if (!pills.length) {
      pills.push("Realtime slot availability");
    }

    return pills.slice(0, 3);
  }, [specialtiesCount, supportedModesKey, totalFeatured]);

  return (
    <section className="relative overflow-hidden bg-[hsl(var(--background))] pb-32 pt-24 dark:bg-[hsl(var(--background))]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,hsl(var(--brand-hero-to))/0.55,transparent_55%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-[linear-gradient(130deg,hsl(var(--brand-hero-from))/0.9_0%,hsl(var(--brand-hero-to))/0.4_55%,transparent_100%)] dark:bg-[linear-gradient(130deg,hsl(var(--brand-hero-from))/0.6,hsl(var(--background))/0.9)]" />
      <Container className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-primary shadow-[0_18px_45px_-28px_rgba(8,47,73,0.65)] backdrop-blur-md dark:bg-card/80 dark:text-primary-foreground">
            <CalendarHeart className="h-4 w-4 text-primary" />
            Book clinic, telehealth, or home visits in minutes
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground md:text-[3.35rem] md:leading-[1.1]">
            Find &amp; book the{" "}
            <span className="bg-linear-to-r from-[hsl(var(--brand-cta))] to-[hsl(var(--brand-cta-hover))] bg-clip-text text-transparent">
              right doctor
            </span>{" "}
            near you.
          </h1>
          <p className="text-lg leading-relaxed text-foreground/70 md:text-xl">
            Compare trusted specialists, read real patient stories, and secure the earliest slot
            that fits your schedule—all in one place.
          </p>

          <QuickSearch
            specialties={specialties}
            loading={isLoadingSpecialties}
            onSearch={() => router.push("/search")}
          />

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-foreground/70 lg:justify-start">
            {highlightPills.map((pill) => (
              <StatPill key={pill} indicator="bg-primary" label={pill} />
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg rounded-4xl bg-white/95 p-6 shadow-2xl shadow-primary/20 backdrop-blur-xl dark:bg-card/90 dark:shadow-[0_30px_65px_-32px_rgba(2,6,23,0.85)] dark:ring-1 dark:ring-primary/20">
          <div className="rounded-[1.75rem] bg-linear-to-br from-primary/10 via-primary/5 to-white p-4 shadow-inner shadow-primary/10 dark:from-primary/15 dark:via-primary/10 dark:to-card dark:ring-1 dark:ring-primary/25">
            <Image
              src="https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80"
              alt="Doctor consulting patient"
              width={640}
              height={760}
              className="h-[420px] w-full rounded-3xl object-cover"
              priority
            />
          </div>
          <HeroAvailabilityCard
            doctor={heroDoctor}
            availability={availability}
            loading={isLoadingFeaturedDoctor || isLoadingAvailability}
          />
        </div>
      </Container>
    </section>
  );
};

const QuickSearch = ({
  specialties,
  loading,
  onSearch,
}: {
  specialties: string[];
  loading: boolean;
  onSearch: () => void;
}) => {
  const popular = specialties.slice(0, 4);

  return (
    <div className="rounded-3xl bg-white/95 p-6 shadow-xl shadow-primary/15 backdrop-blur-xl dark:bg-card/90 dark:shadow-[0_26px_58px_-30px_rgba(2,6,23,0.85)] dark:ring-1 dark:ring-primary/25">
      <div className="grid gap-4 md:grid-cols-[1.25fr_1.25fr_auto]">
        <Select defaultValue="all" disabled={loading || specialties.length === 0}>
          <SelectTrigger className="h-14 rounded-2xl text-left text-base font-medium shadow-md shadow-primary/10 transition hover:shadow-lg focus-visible:ring-primary/25 dark:ring-1 dark:ring-primary/25">
            <SelectValue placeholder={loading ? "Loading specialties..." : "Select specialty"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All specialties</SelectItem>
            {specialties.map((specialty) => (
              <SelectItem key={specialty} value={specialty}>
                {specialty}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-14 rounded-2xl bg-white pl-12 text-base font-medium shadow-md shadow-primary/10 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary/25 dark:bg-background/80 dark:ring-1 dark:ring-primary/25"
            placeholder="City, clinic or neighbourhood"
          />
        </div>
        <Button
          className="flex h-14 items-center gap-2 rounded-2xl px-6 text-base shadow-brand-card"
          onClick={onSearch}
        >
          <Search className="h-5 w-5" />
          Search
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span className="font-semibold uppercase tracking-[0.25em] text-muted-foreground/80">
          Popular
        </span>
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-7 w-28 rounded-full" />
          ))
        ) : popular.length === 0 ? (
          <span className="text-xs uppercase tracking-wide text-muted-foreground/70">
            Doctors are updating availability
          </span>
        ) : (
          popular.map((label) => <LinkChip key={label} label={label} />)
        )}
      </div>
    </div>
  );
};

const HeroAvailabilityCard = ({
  doctor,
  availability,
  loading,
}: {
  doctor: Doctor | undefined;
  availability: DoctorAvailability | undefined;
  loading: boolean;
}) => {
  const slot = getSlotDisplay(availability?.nextAvailableSlot ?? null);

  return (
    <div className="absolute -bottom-12 left-1/2 w-[88%] -translate-x-1/2 rounded-2xl bg-white/95 p-5 shadow-[0_28px_60px_-28px_rgba(8,47,73,0.7)] shadow-primary/25 backdrop-blur-xl dark:bg-card/95 dark:shadow-[0_32px_68px_-30px_rgba(2,6,23,0.85)] dark:ring-1 dark:ring-primary/25">
      {loading ? (
        <div className="flex items-center justify-between gap-6">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="h-6 w-40 rounded-full" />
            <Skeleton className="h-3 w-32 rounded-full" />
          </div>
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
      ) : doctor && slot ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Next available
            </div>
            <div className="text-lg font-semibold text-foreground">
              {slot.dayLabel} · {slot.timeLabel}
            </div>
            <p className="text-sm text-muted-foreground">
              {doctor.name} · {doctor.specialization}
            </p>
          </div>
          <Button size="sm" className="rounded-full px-5 py-2" asChild>
            <Link href={`/doctors/${doctor._id}`}>View slots</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Featured doctors
            </div>
            <p className="text-sm text-muted-foreground">
              Availability updates will appear as doctors publish their schedules.
            </p>
          </div>
          <Button size="sm" className="rounded-full px-5 py-2" asChild>
            <Link href="/search">Discover doctors</Link>
          </Button>
        </div>
      )}
    </div>
  );
};

const LinkChip = ({ label }: { label: string }) => (
  <Link
    href={`/search?specialization=${encodeURIComponent(label)}`}
    className="rounded-full bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground shadow-[0_14px_36px_-28px_rgba(8,47,73,0.65)] transition-all hover:bg-primary/10 hover:text-primary dark:bg-card/80 dark:text-muted-foreground/90 dark:ring-1 dark:ring-primary/20"
  >
    {label}
  </Link>
);

const StatPill = ({ indicator, label }: { indicator: string; label: string }) => (
  <span className="flex items-center gap-2 rounded-full bg-white/75 px-4 py-2 text-xs uppercase tracking-[0.24em] text-muted-foreground shadow-[0_16px_38px_-32px_rgba(8,47,73,0.65)] backdrop-blur-md dark:bg-background/70 dark:text-muted-foreground/90 dark:ring-1 dark:ring-primary/20">
    <span className={`h-2 w-2 rounded-full ${indicator}`} />
    {label}
  </span>
);


