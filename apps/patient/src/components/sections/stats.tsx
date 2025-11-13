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
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0C1116_0%,#114062_45%,#1E90BB_110%)] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18)_0%,transparent_55%)]" />
      <Container className="relative z-10 py-20">
        {isError ? (
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/80">
              Unable to load live stats
            </p>
            <Button variant="outline" className="border-white/50 bg-white/10 px-6 text-white hover:bg-white/20" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-4">
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
    <div className="rounded-[1.4rem] border border-white/25 bg-white/12 p-6 text-center backdrop-blur-md transition-transform hover:-translate-y-1 md:text-left">
      {loading ? (
        <Skeleton className="h-12 w-36 rounded-full bg-white/35" />
      ) : (
        <div
          className="text-4xl font-semibold tracking-tight text-white"
          style={{ fontFamily: "var(--font-illajwala-mono)" }}
        >
          {value ?? "—"}
        </div>
      )}
      <div className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
        {label}
      </div>
    </div>
  );
};

