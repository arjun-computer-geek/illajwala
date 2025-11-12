"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo } from "react";
import { queryKeys } from "@/lib/query-keys";
import type { Doctor } from "@/types/api";
import { doctorsApi } from "@/lib/api/doctors";
import { Container } from "@/components/layout/container";
import { DoctorCard } from "@/components/doctor/doctor-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const FeaturedDoctorsSection = () => {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.doctors({ featured: true, pageSize: 6, sort: "rating" }),
    queryFn: () => doctorsApi.list({ pageSize: 6, sort: "rating", featured: true }),
    staleTime: 2 * 60 * 1000,
  });

  const doctors: Doctor[] = useMemo(() => data?.data ?? [], [data?.data]);

  return (
    <section className="bg-[hsl(var(--background))] py-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.32em] text-primary/80">
            Patient favourites
          </span>
          <h2 className="mt-4 text-3xl font-semibold text-foreground md:text-[2.5rem] md:leading-tight">
            Top-rated specialists near you
          </h2>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            High-satisfaction doctors curated across specialities so you can choose care that fits
            your expectations.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => <DoctorCardSkeleton key={index} />)
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : doctors.length === 0 ? (
            <EmptyState />
          ) : (
            doctors.map((doctor) => <DoctorCard key={doctor._id} doctor={doctor} />)
          )}
        </div>

        <div className="mt-14 text-center">
          <Link href="/search">
            <Button size="lg" className="px-10 text-base">
              Browse all doctors
            </Button>
          </Link>
        </div>
      </Container>
    </section>
  );
};

const DoctorCardSkeleton = () => (
  <div className="flex h-full flex-col justify-between rounded-[1.2rem] border border-border/40 bg-white/75 p-8 shadow-[0_18px_40px_-26px_rgba(32,113,182,0.28)] dark:border-border/30 dark:bg-background/70">
    <div className="mx-auto h-24 w-24">
      <Skeleton className="h-full w-full rounded-2xl bg-muted" />
    </div>
    <Skeleton className="mx-auto mt-6 h-6 w-40 rounded-full bg-muted" />
    <Skeleton className="mx-auto h-4 w-28 rounded-full bg-muted" />
    <div className="mt-6 space-y-4 text-center">
      <Skeleton className="mx-auto h-4 w-32 rounded-full bg-muted" />
      <Skeleton className="mx-auto h-4 w-48 rounded-full bg-muted" />
      <Skeleton className="mx-auto h-8 w-36 rounded-full bg-muted" />
      <Skeleton className="mx-auto h-12 w-full rounded-full bg-muted" />
    </div>
  </div>
);

const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="col-span-full rounded-[1.2rem] border border-destructive/20 bg-destructive/10 p-10 text-center shadow-[0_20px_48px_-30px_rgba(245,108,108,0.4)] dark:border-destructive/35 dark:bg-destructive/20">
    <h3 className="text-lg font-semibold text-destructive">We couldn&apos;t load featured doctors</h3>
    <p className="mt-2 text-sm text-muted-foreground">
      Please check your connection and try again.
    </p>
    <Button variant="outline" className="mt-5 px-6" onClick={onRetry}>
      Retry
    </Button>
  </div>
);

const EmptyState = () => (
  <div className="col-span-full rounded-[1.2rem] border border-border/50 bg-white/85 p-12 text-center shadow-[0_24px_56px_-30px_rgba(32,113,182,0.32)] dark:border-border/40 dark:bg-background/75">
    <h3 className="text-lg font-semibold text-foreground">Featured doctors coming soon</h3>
    <p className="mt-3 text-sm text-muted-foreground">
      We&apos;re curating the top-rated specialists right now. Browse the directory to discover more
      doctors.
    </p>
  </div>
);

