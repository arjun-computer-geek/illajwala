"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Container } from "@/components/layout/container";
import { statsApi } from "@/lib/api/stats";
import { queryKeys } from "@/lib/query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const numberFormatter = Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
  notation: "compact",
});

export const StatsSection = () => {
  const {
    data: overview,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.statsOverview,
    queryFn: statsApi.overview,
    staleTime: 60_000,
  });

  const stats = useMemo(
    () => [
      {
        label: "Verified doctors",
        value:
          overview?.totals.doctors !== undefined
            ? numberFormatter.format(overview.totals.doctors)
            : null,
      },
      {
        label: "Specialties covered",
        value:
          overview?.totals.specialties !== undefined
            ? numberFormatter.format(overview.totals.specialties)
            : null,
      },
      {
        label: "Appointments booked",
        value:
          overview?.totals.appointments !== undefined
            ? numberFormatter.format(overview.totals.appointments)
            : null,
      },
      {
        label: "Average patient rating",
        value:
          overview?.ratings.averageRating !== undefined && overview?.ratings.averageRating !== null
            ? `${overview.ratings.averageRating.toFixed(1)}★`
            : null,
      },
    ],
    [overview]
  );

  return (
    <section className="relative overflow-hidden bg-[hsl(var(--primary))] text-white dark:bg-[hsl(var(--brand-hero-from))] dark:text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--brand-cta))/0.35,transparent_55%)] dark:bg-[radial-gradient(circle_at_bottom_left,hsl(var(--primary))/0.22,transparent_55%)]" />
      <Container className="py-16">
        {isError ? (
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/75 dark:text-muted-foreground">
              Unable to load live stats
            </p>
            <Button variant="secondary" className="rounded-full px-5" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid gap-10 text-center md:grid-cols-4 md:text-left">
            {stats.map((stat) => (
              <StatCard
                key={stat.label}
                loading={isLoading}
                label={stat.label}
                value={stat.value}
              />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
};

const StatCard = ({ value, label, loading }: { value: string | null; label: string; loading: boolean }) => {
  return (
    <div className="space-y-2">
      {loading ? (
        <Skeleton className="h-10 w-32 rounded-full bg-white/20 dark:bg-muted/50" />
      ) : (
        <div className="text-4xl font-semibold tracking-tight drop-shadow-sm">
          {value ?? "—"}
        </div>
      )}
      <div className="text-sm font-medium uppercase tracking-[0.28em] text-white/80 dark:text-muted-foreground">
        {label}
      </div>
    </div>
  );
};

