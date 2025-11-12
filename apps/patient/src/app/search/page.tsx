import { SearchFilters } from "@/components/search/search-filters";
import { SearchResults } from "@/components/search/search-results";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Container } from "@/components/layout/container";

export const metadata = {
  title: "Search doctors",
  description: "Filter and discover illajwala doctors across specialties, cities, and consultation modes.",
};

export default function SearchPage() {
  return (
    <div className="bg-muted/30 py-20">
      <Container className="space-y-12">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">
              Doctor discovery
            </span>
            <h1 className="text-3xl font-bold text-foreground md:text-[2.5rem] md:leading-[1.15]">
              Find the right doctor for your visit
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
              Refine by specialty, location, consultation mode, and more. We surface real-time
              availability so you can confirm your appointment in minutes.
            </p>
          </div>
          <Button variant="outline" className="rounded-full px-6 shadow-[0_18px_45px_-28px_rgba(8,47,73,0.55)] dark:shadow-[0_24px_54px_-30px_rgba(2,6,23,0.85)]" asChild>
            <Link href="/account/appointments">Go to my appointments</Link>
          </Button>
        </div>

        <div className="flex flex-col gap-10 lg:flex-row">
          <Suspense fallback={<SearchFiltersFallback />}>
            <aside className="lg:w-[320px] xl:w-[360px]">
              <div className="top-28 space-y-6 lg:sticky">
                <SearchFilters />
              </div>
            </aside>
          </Suspense>

          <main className="flex-1">
            <Suspense fallback={<SearchResultsFallback />}>
              <SearchResults />
            </Suspense>
          </main>
        </div>
      </Container>
    </div>
  );
}

const SearchFiltersFallback = () => (
  <div className="rounded-3xl bg-white/90 p-6 shadow-xl shadow-primary/10 dark:bg-card/90 dark:shadow-[0_28px_60px_-30px_rgba(2,6,23,0.85)] dark:ring-1 dark:ring-primary/20">
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full rounded-2xl" />
      ))}
    </div>
  </div>
);

const SearchResultsFallback = () => (
  <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white/90 p-6 shadow-lg shadow-primary/10 dark:bg-card/90 dark:shadow-[0_26px_58px_-30px_rgba(2,6,23,0.85)] dark:ring-1 dark:ring-primary/20">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48 rounded-full" />
        <Skeleton className="h-4 w-64 rounded-full" />
      </div>
      <Skeleton className="h-8 w-32 rounded-full" />
    </div>
    <div className="grid gap-6 md:grid-cols-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-80 rounded-3xl" />
      ))}
    </div>
  </div>
);

