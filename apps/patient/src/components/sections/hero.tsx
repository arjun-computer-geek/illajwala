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
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,#F3FAFC_0%,#E5F6F6_55%,rgba(32,113,182,0.12)_100%)] pb-28 pt-24 dark:bg-[linear-gradient(135deg,rgba(10,28,36,0.95)_0%,rgba(12,32,45,0.9)_50%,rgba(16,52,70,0.85)_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_top_left,rgba(28,164,163,0.35),transparent_55%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(48,214,200,0.25),transparent_55%)]" />
      <Container className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-10 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-5 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary shadow-[0_14px_32px_-22px_rgba(32,113,182,0.35)] backdrop-blur-sm dark:bg-background/60">
            <CalendarHeart className="h-4 w-4" />
            Care without waiting
          </div>
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold leading-tight text-foreground md:text-[3.2rem] md:leading-[1.05]">
              Book trusted doctors with{" "}
              <span className="bg-[linear-gradient(135deg,#1CA4A3_0%,#2071B6_100%)] bg-clip-text text-transparent">
                calm confidence
              </span>
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground md:text-xl md:leading-[1.6]">
              Compare availability, read real patient stories, and reserve the earliest visit that
              fits your life—whether it&apos;s in-clinic, virtual, or at home.
            </p>
          </div>

          <QuickSearch
            specialties={specialties}
            loading={isLoadingSpecialties}
            onSearch={() => router.push("/search")}
          />

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-muted-foreground lg:justify-start">
            {highlightPills.map((pill) => (
              <StatPill key={pill} label={pill} />
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg rounded-[1.6rem] bg-white/80 p-6 shadow-[0_34px_80px_-32px_rgba(32,113,182,0.35)] backdrop-blur-xl ring-1 ring-border/60 dark:bg-background/80 dark:ring-border/50">
          <div className="rounded-[1.4rem] bg-[linear-gradient(160deg,rgba(28,164,163,0.16)_0%,rgba(32,113,182,0.12)_100%)] p-4">
            <Image
              src="https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80"
              alt="Doctor consulting patient"
              width={640}
              height={760}
              className="h-[420px] w-full rounded-[1.2rem] object-cover"
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
    <div className="rounded-[1.4rem] bg-white/85 p-6 shadow-[0_26px_60px_-28px_rgba(32,113,182,0.28)] backdrop-blur-xl ring-1 ring-border/60 dark:bg-background/70 dark:ring-border/40">
      <div className="grid gap-4 md:grid-cols-[1.15fr_1.15fr_auto]">
        <Select defaultValue="all" disabled={loading || specialties.length === 0}>
          <SelectTrigger className="h-12 rounded-[1.2rem] border border-border/60 bg-white/80 text-left text-base font-medium text-foreground shadow-[0_12px_30px_-24px_rgba(32,113,182,0.35)] transition-colors duration-200 ease-out hover:border-ring focus-visible:border-primary focus-visible:ring-0 dark:border-border/40 dark:bg-background/60">
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
            className="h-12 rounded-[1.2rem] border border-border/60 bg-white/80 pl-12 text-base font-medium shadow-[0_12px_30px_-24px_rgba(32,113,182,0.35)] dark:border-border/40 dark:bg-background/60 dark:shadow-none"
            placeholder="City, clinic or neighbourhood"
          />
        </div>
        <Button
          className="flex h-12 items-center gap-2 px-6 text-base"
          onClick={onSearch}
        >
          <Search className="h-5 w-5" />
          Search
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.26em] text-muted-foreground">
        <span className="text-muted-foreground/70">
          Popular
        </span>
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-7 w-28 rounded-full" />
          ))
        ) : popular.length === 0 ? (
          <span className="text-[0.65rem] uppercase tracking-[0.35em] text-muted-foreground/60">
            Updating
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
    <div className="absolute -bottom-12 left-1/2 w-[88%] -translate-x-1/2 rounded-[1.2rem] border border-border/60 bg-white/90 p-5 shadow-[0_24px_52px_-24px_rgba(32,113,182,0.32)] backdrop-blur-xl dark:border-border/40 dark:bg-background/85 dark:shadow-none">
      {loading ? (
        <div className="flex items-center justify-between gap-6">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded-full bg-muted" />
            <Skeleton className="h-6 w-40 rounded-full bg-muted" />
            <Skeleton className="h-3 w-32 rounded-full bg-muted" />
          </div>
          <Skeleton className="h-10 w-28 rounded-full bg-muted" />
        </div>
      ) : doctor && slot ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground/80">
              Next available
            </div>
            <div className="text-lg font-semibold text-foreground">
              {slot.dayLabel} · {slot.timeLabel}
            </div>
            <p className="text-sm text-muted-foreground">
              {doctor.name} · {doctor.specialization}
            </p>
          </div>
          <Button size="sm" className="px-5" asChild>
            <Link href={`/doctors/${doctor._id}`}>View slots</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground/80">
              Featured doctors
            </div>
            <p className="text-sm text-muted-foreground">
              Availability updates will appear as doctors publish their schedules.
            </p>
          </div>
          <Button size="sm" className="px-5" asChild>
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
    className="rounded-full border border-border/50 bg-white/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground transition-colors duration-200 ease-out hover:border-primary/60 hover:bg-accent/70 hover:text-primary dark:bg-background/60"
  >
    {label}
  </Link>
);

const StatPill = ({ label }: { label: string }) => (
  <span className="rounded-full border border-border/60 bg-white/70 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground shadow-[0_12px_28px_-24px_rgba(32,113,182,0.3)] backdrop-blur-sm dark:border-border/40 dark:bg-background/60">
    {label}
  </span>
);


