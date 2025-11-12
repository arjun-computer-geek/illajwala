"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { queryKeys } from "@/lib/query-keys";
import type { Doctor } from "@/types/api";
import { DoctorCard } from "@/components/doctor/doctor-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { doctorsApi } from "@/lib/api/doctors";

export const SearchResults = () => {
  const searchParams = useSearchParams();
  const paramsObject = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.doctors(paramsObject),
    queryFn: async () => {
      return doctorsApi.list(paramsObject);
    },
  });

  const doctors: Doctor[] = data?.data ?? [];
  const total = data?.meta?.total ?? doctors.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white/90 p-6 shadow-xl shadow-primary/10 backdrop-blur-md transition-transform duration-200 hover:-translate-y-px dark:bg-card/90 dark:shadow-[0_28px_62px_-30px_rgba(2,6,23,0.85)] dark:ring-1 dark:ring-primary/20">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">Available doctors</h2>
          <p className="text-sm text-muted-foreground">
            {total > 0 ? `${total} doctors match your filters.` : "Adjust filters to discover more doctors nearby."}
          </p>
        </div>
        <Badge variant="outline" className="rounded-full px-4 py-1 text-sm font-semibold shadow-[0_14px_34px_-24px_rgba(15,23,42,0.55)] dark:ring-primary/25">
          {total} doctors
        </Badge>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-80 rounded-3xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : doctors.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor._id} doctor={doctor} />
          ))}
        </div>
      )}
    </div>
  );
};

const EmptyState = () => (
  <div className="rounded-3xl bg-white/90 p-12 text-center shadow-xl shadow-primary/10 dark:bg-card/90 dark:shadow-[0_30px_65px_-30px_rgba(2,6,23,0.85)] dark:ring-1 dark:ring-primary/20">
    <h3 className="text-lg font-semibold text-foreground">No doctors match your filters</h3>
    <p className="mt-3 text-sm text-muted-foreground">
      Try changing specialties, location, or consultation mode to view more options.
    </p>
  </div>
);

const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="rounded-3xl bg-destructive/5 p-10 text-center shadow-[0_20px_48px_-28px_rgba(220,38,38,0.45)] dark:bg-destructive/10 dark:shadow-[0_26px_58px_-30px_rgba(248,113,113,0.35)] dark:ring-1 dark:ring-destructive/40">
    <h3 className="text-lg font-semibold text-destructive">We couldn&apos;t load doctors right now</h3>
    <p className="mt-2 text-sm text-muted-foreground">Please check your connection and try again.</p>
    <Button variant="secondary" className="mt-5 rounded-full px-6" onClick={onRetry}>
      Retry search
    </Button>
  </div>
);

