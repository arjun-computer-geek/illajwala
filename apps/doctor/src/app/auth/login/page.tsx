"use client";

import { useMemo, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Separator,
} from "@illajwala/ui";
import { loginDoctorSchema, type LoginDoctorInput } from "@illajwala/types";
import { doctorAuthApi } from "../../../lib/api/auth";
import { useDoctorAuth } from "../../../hooks/use-auth";
import { useTenantBootstrap } from "../../../lib/tenant";

type DoctorLoginFormValues = LoginDoctorInput;

const defaultValues: Partial<DoctorLoginFormValues> = {
  email: "",
  phone: undefined,
};

const careHighlights = [
  {
    title: "One calendar, all channels",
    description: "Sync clinic, telehealth, and outreach visits with buffers that prevent clashes.",
  },
  {
    title: "Realtime patient nudges",
    description: "Auto-confirm, remind, and re-route waitlists so your staff can focus on care.",
  },
  {
    title: "Staff roles that scale",
    description: "Invite coordinators with scoped access and keep audit logs for every action.",
  },
];

export default function DoctorLoginPage() {
  useTenantBootstrap();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setAuth, hydrated, isAuthenticated } = useDoctorAuth();

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [hydrated, isAuthenticated, router]);

  const form = useForm<DoctorLoginFormValues>({
    resolver: zodResolver(loginDoctorSchema),
    defaultValues,
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const authResponse = await doctorAuthApi.login({
        ...values,
        phone: values.phone?.trim() ? values.phone.trim() : undefined,
      });
      setAuth(authResponse);
      toast.success(`Welcome back, Dr. ${authResponse.doctor.name}`);
      const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
      router.replace(redirectTo);
    } catch (error) {
      console.error(error);
      toast.error("Unable to sign in – please verify your credentials.");
    }
  });

  const experienceNotes = useMemo(
    () => [
      { label: "Clinics live", value: "180+" },
      { label: "Avg. response", value: "<5 min support" },
      { label: "Utilisation uplift", value: "+18% YoY" },
    ],
    []
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#F3FAFC_0%,#E7F6F5_50%,rgba(32,113,182,0.15)_100%)] px-4 py-16 dark:bg-[linear-gradient(135deg,rgba(10,28,36,0.94)_0%,rgba(12,32,45,0.9)_60%,rgba(16,52,70,0.85)_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_top_left,rgba(28,164,163,0.32),transparent_60%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(48,214,200,0.22),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-[-320px] w-[520px] rounded-full bg-[rgba(32,113,182,0.12)] blur-[180px]" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
          <Badge variant="outline" className="rounded-full border-primary/40 bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.32em] text-primary shadow-[0_14px_36px_-24px_rgba(32,113,182,0.35)] backdrop-blur-sm dark:bg-background/60">
            Doctor hub access
          </Badge>
          <div className="max-w-2xl space-y-3">
            <h1 className="text-3xl font-semibold leading-tight md:text-[2.4rem] md:leading-[1.1]">
              Sign in to keep{" "}
              <span className="bg-[linear-gradient(135deg,#1CA4A3_0%,#2071B6_100%)] bg-clip-text text-transparent">
                clinic days effortless
              </span>
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Manage occupancy, nudge patients, and coordinate teams inside a calm workspace built for Illajwala providers.
            </p>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
          <Card className="border border-border/60 bg-white/85 shadow-[0_26px_60px_-30px_rgba(32,113,182,0.32)] backdrop-blur-xl dark:border-border/40 dark:bg-background/80">
            <CardHeader className="space-y-4 pb-4 text-center lg:text-left">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-semibold tracking-tight">Welcome back, doctor</CardTitle>
                <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                  Enter your clinic credentials to publish slots, unlock telehealth availability, and keep staff in sync.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <Form {...form}>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            autoComplete="email"
                            placeholder="doctor@illajwala.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            autoComplete="tel"
                            placeholder="+91 98765 43210"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </Form>

              <Separator />

              <div className="grid gap-3 rounded-[1.2rem] border border-border/60 bg-secondary/50 p-4 text-left text-sm leading-relaxed text-muted-foreground dark:border-border/40 dark:bg-background/60">
                <p className="font-medium text-foreground">Need access?</p>
                <p className="text-xs">
                  Contact your clinic administrator or email{" "}
                  <a href="mailto:providers@illajwala.com" className="text-primary underline">
                    providers@illajwala.com
                  </a>{" "}
                  to request onboarding.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 text-center text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-left">
              <span>Having trouble? providers@illajwala.com</span>
              <Button variant="ghost" asChild className="h-8 px-3 text-xs">
                <a href="/">Back to clinic microsite</a>
              </Button>
            </CardFooter>
          </Card>

          <div className="space-y-6 rounded-[1.4rem] border border-border/60 bg-white/75 p-8 shadow-[0_30px_68px_-32px_rgba(32,113,182,0.3)] backdrop-blur-xl dark:border-border/40 dark:bg-background/75">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary/80">Why teams rely on Illajwala</p>
              <h2 className="text-xl font-semibold text-foreground">Built for calm clinic operations</h2>
            </div>
            <div className="grid gap-5 text-sm text-muted-foreground">
              {careHighlights.map((item) => (
                <div key={item.title} className="flex flex-col gap-1 rounded-[1.1rem] border border-border/50 bg-white/80 p-4 shadow-[0_16px_34px_-28px_rgba(32,113,182,0.28)] dark:border-border/40 dark:bg-background/70">
                  <span className="text-sm font-semibold text-foreground">{item.title}</span>
                  <span className="text-xs leading-relaxed">{item.description}</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="grid gap-3 sm:grid-cols-3">
              {experienceNotes.map((note) => (
                <div key={note.label} className="rounded-[1.1rem] border border-border/50 bg-white/70 px-4 py-3 text-center text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground dark:border-border/40 dark:bg-background/60">
                  <div className="text-base font-semibold tracking-tight text-foreground">{note.value}</div>
                  <div>{note.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

