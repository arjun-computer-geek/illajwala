"use client";

import { useEffect, useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { doctorsApi } from "@/lib/api/doctors";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

const filterSchema = z.object({
  query: z.string().optional(),
  specialization: z.string().optional(),
  city: z.string().optional(),
  consultationMode: z.string().optional(),
});

export type SearchFiltersValues = z.infer<typeof filterSchema>;

const defaultSpecialties = ["Cardiology", "Dermatology", "Pediatrics", "Orthopedics", "Neurology"];
const ALL_SPECIALTIES_VALUE = "all";
const ANY_MODE_VALUE = "any";

type SearchFiltersProps = {
  className?: string;
};

export const SearchFilters = ({ className }: SearchFiltersProps = {}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { data: specialtiesData, isLoading: isLoadingSpecialties } = useQuery({
    queryKey: queryKeys.doctorSpecialties,
    queryFn: doctorsApi.listSpecialties,
    staleTime: 1000 * 60 * 60,
  });

  const specialties = useMemo(() => {
    const source = specialtiesData && specialtiesData.length > 0 ? specialtiesData : defaultSpecialties;
    const normalized = source
      .map((item) => item.trim())
      .filter((item): item is string => Boolean(item && item.length > 0));
    return Array.from(new Set(normalized)).sort((a, b) => a.localeCompare(b));
  }, [specialtiesData]);

  const selectDefault = (value: string | null, fallback: string) =>
    value && value.trim().length > 0 ? value : fallback;

  const form = useForm<SearchFiltersValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      query: searchParams.get("query") ?? "",
      specialization: selectDefault(searchParams.get("specialization"), ALL_SPECIALTIES_VALUE),
      city: searchParams.get("city") ?? "",
      consultationMode: selectDefault(searchParams.get("consultationMode"), ANY_MODE_VALUE),
    },
  });

  const searchParamsSignature = searchParams.toString();

  useEffect(() => {
    const params = new URLSearchParams(searchParamsSignature);

    form.reset({
      query: params.get("query") ?? "",
      specialization: selectDefault(params.get("specialization"), ALL_SPECIALTIES_VALUE),
      city: params.get("city") ?? "",
      consultationMode: selectDefault(params.get("consultationMode"), ANY_MODE_VALUE),
    });
  }, [searchParamsSignature, form]);

  const onSubmit = (values: SearchFiltersValues) => {
    const params = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
      const trimmed = value?.trim();
      if (!trimmed) {
        return;
      }
      if (
        (key === "specialization" && trimmed === ALL_SPECIALTIES_VALUE) ||
        (key === "consultationMode" && trimmed === ANY_MODE_VALUE)
      ) {
        return;
      }
      params.set(key, trimmed);
    });
    startTransition(() => {
      router.replace(`/search?${params.toString()}`);
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          "space-y-8 rounded-3xl bg-white/95 p-6 shadow-xl shadow-primary/10 backdrop-blur-md dark:bg-background/90 dark:shadow-[0_28px_60px_-30px_rgba(2,6,23,0.85)] dark:ring-1 dark:ring-primary/20",
          className,
        )}
      >
        <div className="space-y-5">
          <FormField
            control={form.control}
            name="query"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Doctor or symptom
                </FormLabel>
                <FormControl>
                  <Input
                    className="h-12 rounded-2xl bg-background/60 text-sm font-medium shadow-md shadow-primary/10 focus:border-transparent focus:ring-primary/25 dark:bg-card/80 dark:ring-1 dark:ring-primary/20"
                    placeholder="E.g. cardiologist, fever, Dr. Mehta"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  City / neighbourhood
                </FormLabel>
                <FormControl>
                  <Input
                    className="h-12 rounded-2xl bg-background/60 text-sm font-medium shadow-md shadow-primary/10 focus:border-transparent focus:ring-primary/25 dark:bg-card/80 dark:ring-1 dark:ring-primary/20"
                    placeholder="Enter city or locality"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="specialization"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Specialty
                </FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isPending || isLoadingSpecialties}
                >
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-2xl bg-background/60 text-sm font-medium shadow-md shadow-primary/10 transition hover:shadow-lg focus-visible:ring-primary/25 dark:bg-card/80 dark:ring-1 dark:ring-primary/20">
                      <SelectValue placeholder="All specialties" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={ALL_SPECIALTIES_VALUE}>All specialties</SelectItem>
                    {specialties.map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="consultationMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Consultation mode
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-2xl bg-background/60 text-sm font-medium shadow-md shadow-primary/10 transition hover:shadow-lg focus-visible:ring-primary/25 dark:bg-card/80 dark:ring-1 dark:ring-primary/20">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={ANY_MODE_VALUE}>Any</SelectItem>
                    <SelectItem value="clinic">Clinic visit</SelectItem>
                    <SelectItem value="telehealth">Video consult</SelectItem>
                    <SelectItem value="home-visit">Home visit</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-6 rounded-2xl bg-background/40 p-5 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.55)] dark:bg-card/60 dark:shadow-[0_24px_58px_-30px_rgba(2,6,23,0.75)] dark:ring-1 dark:ring-primary/20">
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Distance (km)
            </div>
            <Slider value={[25]} max={50} step={5} disabled className="cursor-not-allowed opacity-40" />
            <p className="text-xs text-muted-foreground/70">
              Advanced proximity filters arrive with location data in the next release.
            </p>
          </div>
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Max consultation fee
            </div>
            <Slider value={[1500]} max={5000} step={100} disabled className="cursor-not-allowed opacity-40" />
          </div>
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Minimum rating
            </div>
            <Slider value={[4]} max={5} step={0.1} disabled className="cursor-not-allowed opacity-40" />
          </div>
        </div>

        <Button type="submit" className="w-full rounded-full py-3 text-base" disabled={isPending}>
          {isPending ? "Searching..." : "Apply filters"}
        </Button>
      </form>
    </Form>
  );
};

