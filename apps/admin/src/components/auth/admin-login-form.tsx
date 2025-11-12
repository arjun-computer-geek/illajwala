"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@illajwala/ui";
import { loginAdminSchema, type LoginAdminInput } from "@illajwala/types";
import { adminAuthApi } from "../../lib/api/auth";
import { useAdminAuth } from "../../hooks/use-auth";

type AdminLoginFormValues = LoginAdminInput;

const defaultValues: AdminLoginFormValues = {
  email: "",
  password: "",
};

export const AdminLoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth, hydrated, isAuthenticated } = useAdminAuth();

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [hydrated, isAuthenticated, router]);

  const form = useForm<AdminLoginFormValues>({
    resolver: zodResolver(loginAdminSchema),
    defaultValues,
  });

  const handleSubmit = form.handleSubmit(async (values: AdminLoginFormValues) => {
    try {
      const response = await adminAuthApi.login(values);
      setAuth(response);
      toast.success(`Welcome back, ${response.admin.name}`);
      const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
      router.replace(redirectTo);
    } catch (error) {
      console.error(error);
      toast.error("Unable to sign in – please verify your credentials.");
    }
  });

  return (
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
                  placeholder="ops@illajwala.com"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </span>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </Form>
  );
};

