"use client";

import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Separator,
} from "@illajwala/ui";
import { AdminLoginForm } from "../../../components/auth/admin-login-form";

export default function AdminLoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-gradient px-4 py-16">
      <div className="absolute inset-x-0 top-[-120px] h-[320px] bg-brand-surface opacity-70 blur-[100px]" />

      <Card className="relative z-10 w-full max-w-xl overflow-hidden border border-border/60 bg-card/95 shadow-2xl shadow-primary/25 backdrop-blur">
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary via-sky-400 to-primary/70" />
        <CardHeader className="space-y-4 pb-6 text-center">
          <Badge variant="outline" className="mx-auto w-fit rounded-full px-3 py-1 text-[13px]">
            Admin Console
          </Badge>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-semibold tracking-tight">
              Sign in to continue
            </CardTitle>
            <CardDescription className="mx-auto max-w-md text-sm leading-relaxed">
              Use your Illajwala operations credentials to access provider verification, clinic
              onboarding, and platform analytics.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <AdminLoginForm />

          <Separator />

          <div className="grid gap-3 rounded-2xl bg-secondary/50 p-4 text-left text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Demo credentials</p>
            <div className="grid gap-1 text-xs">
              <p>
                <span className="font-medium text-foreground">Email:</span> ops@illajwala.com
              </p>
              <p>
                <span className="font-medium text-foreground">Password:</span> admin123
              </p>
            </div>
            <p className="text-xs">
              Generated via the identity-service seed script. Change the password once real admins
              are provisioned.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 text-center text-xs text-muted-foreground">
          <p>
            Need help? Contact{" "}
            <Link href="mailto:support@illajwala.com" className="text-primary underline">
              support@illajwala.com
            </Link>
          </p>
          <Button variant="ghost" asChild className="h-8 px-3 text-xs">
            <Link href="/">Back to admin landing</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

