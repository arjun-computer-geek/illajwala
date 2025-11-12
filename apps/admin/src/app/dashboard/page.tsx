"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminAuth } from "../../hooks/use-auth";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@illajwala/ui";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, hydrated, admin, clearAuth } = useAdminAuth();

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/auth/login?redirectTo=/dashboard");
    }
  }, [hydrated, isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/20 px-6 py-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-primary">Admin Console</p>
            <h1 className="mt-3 text-3xl font-semibold">Welcome back, {admin?.name}</h1>
            <p className="text-sm text-muted-foreground">
              Monitor provider onboarding, clinic operations, and booking performance in real time.
            </p>
          </div>
          <Button variant="outline" onClick={clearAuth}>
            Sign out
          </Button>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Provider Verification</CardTitle>
              <CardDescription>
                Review credential submissions and approve clinics awaiting activation.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-semibold">14</p>
                <p className="text-sm text-muted-foreground">Pending reviews</p>
              </div>
              <Button asChild>
                <Link href="#">Open queue</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Health</CardTitle>
              <CardDescription>
                Keep an eye on booking conversion, cancellations, and support interactions.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-semibold">96%</p>
                <p className="text-sm text-muted-foreground">SLA met this week</p>
              </div>
              <Button variant="secondary" asChild>
                <Link href="#">View reports</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

