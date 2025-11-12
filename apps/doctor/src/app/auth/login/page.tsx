"use client";

import { useEffect } from "react";
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

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-gradient px-4 py-16">
      <div className="absolute inset-x-0 top-[-140px] h-[340px] bg-brand-surface opacity-70 blur-[110px]" />

      <Card className="relative z-10 w-full max-w-xl overflow-hidden border border-border/60 bg-card/95 shadow-2xl shadow-primary/25 backdrop-blur">
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary via-emerald-400 to-primary/70" />
        <CardHeader className="space-y-4 pb-6 text-center">
          <Badge variant="outline" className="mx-auto w-fit rounded-full px-3 py-1 text-[13px]">
            Doctor Hub
          </Badge>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-semibold tracking-tight">
              Manage your clinic schedule
            </CardTitle>
            <CardDescription className="mx-auto max-w-md text-sm leading-relaxed">
              Sign in with your Illajwala clinic credentials to publish slots, coordinate staff, and
              keep appointments running smoothly.
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

          <div className="grid gap-3 rounded-2xl bg-secondary/50 p-4 text-left text-sm text-muted-foreground">
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

        <CardFooter className="flex flex-col gap-3 text-center text-xs text-muted-foreground">
          <Button variant="ghost" asChild className="h-8 px-3 text-xs">
            <a href="/">Back to clinic microsite</a>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

