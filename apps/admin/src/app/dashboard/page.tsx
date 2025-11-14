'use client';

import { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@illajwala/ui';
import {
  Activity,
  Building2,
  DollarSign,
  LineChart,
  ShieldCheck,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';
import type { OpsMetricsSummary } from '@/types/admin';
import { useAdminAuth } from '../../hooks/use-auth';
import { AdminShell } from '../../components/layout/admin-shell';
import { type DashboardRealtimeEvent, useDashboardRealtime } from '../../lib/realtime/dashboard';
import { useOpsMetricsQuery } from '../../components/dashboard/queries/use-ops-metrics';

// Lazy load heavy components for better initial page load
const ProviderReviewQueue = lazy(() =>
  import('../../components/dashboard/provider-review-queue').then((mod) => ({
    default: mod.ProviderReviewQueue,
  })),
);
const ActivityLog = lazy(() =>
  import('../../components/dashboard/activity-log').then((mod) => ({ default: mod.ActivityLog })),
);
const BookingsTable = lazy(() =>
  import('../../components/dashboard/bookings-table').then((mod) => ({
    default: mod.BookingsTable,
  })),
);
const OpsAnalyticsCharts = lazy(() =>
  import('../../components/dashboard/ops-analytics-charts').then((mod) => ({
    default: mod.OpsAnalyticsCharts,
  })),
);
const NotificationResendPanel = lazy(() =>
  import('../../components/dashboard/notification-resend-panel').then((mod) => ({
    default: mod.NotificationResendPanel,
  })),
);
const WaitlistOversightPanel = lazy(() =>
  import('../../components/dashboard/waitlist-oversight-panel').then((mod) => ({
    default: mod.WaitlistOversightPanel,
  })),
);
const WaitlistPolicyConfig = lazy(() =>
  import('../../components/dashboard/waitlist-policy-config').then((mod) => ({
    default: mod.WaitlistPolicyConfig,
  })),
);
const SLAAnalytics = lazy(() =>
  import('../../components/dashboard/sla-analytics').then((mod) => ({ default: mod.SLAAnalytics })),
);
const MultiClinicView = lazy(() =>
  import('../../components/dashboard/multi-clinic-view').then((mod) => ({
    default: mod.MultiClinicView,
  })),
);

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, hydrated, admin, clearAuth, token } = useAdminAuth();
  const [liveMetrics, setLiveMetrics] = useState<OpsMetricsSummary | null>(null);
  const {
    data: initialMetrics,
    isLoading: metricsLoading,
    isError: metricsError,
    refetch: refetchMetrics,
  } = useOpsMetricsQuery({
    enabled: hydrated && isAuthenticated,
  });

  useEffect(() => {
    if (initialMetrics) {
      setLiveMetrics(initialMetrics);
    }
  }, [initialMetrics]);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace('/auth/login?redirectTo=/dashboard');
    }
  }, [hydrated, isAuthenticated, router]);

  const handleRealtimeEvent = (event: DashboardRealtimeEvent) => {
    if (event.type === 'metrics.updated') {
      setLiveMetrics((current) => {
        const fallback: OpsMetricsSummary = initialMetrics ?? {
          activeConsultations: 0,
          waitingPatients: 0,
          averageWaitTime: 0,
          noShowRate: 0,
          revenueToday: 0,
          clinicsActive: 0,
          clinicsPending: 0,
          alertsOpen: 0,
        };
        return {
          ...fallback,
          ...event.metrics,
        };
      });
      return;
    }

    if (event.type === 'appointment.created' || event.type === 'appointment.status.changed') {
      void refetchMetrics();
    }
  };

  const handleRealtimeError = (error: Error) => {
    console.error('[admin] Dashboard realtime error', error);
    toast.error('Ops dashboard live updates interrupted', {
      description: 'We’re retrying the connection. Refresh manually if needed.',
    });
  };

  const connectionState = useDashboardRealtime({
    token: token ?? null,
    enabled: hydrated && isAuthenticated && Boolean(token),
    onEvent: handleRealtimeEvent,
    onError: handleRealtimeError,
  });

  const connectionBadge = useMemo(() => {
    switch (connectionState) {
      case 'open':
        return (
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-600">
            <Wifi className="h-3.5 w-3.5" />
            Live
          </div>
        );
      case 'connecting':
        return (
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-amber-600">
            <Wifi className="h-3.5 w-3.5 animate-pulse" />
            Connecting
          </div>
        );
      case 'error':
        return (
          <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1 text-rose-600">
            <WifiOff className="h-3.5 w-3.5" />
            Reconnecting
          </div>
        );
      case 'closed':
      case 'idle':
      default:
        return (
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-muted-foreground">
            <WifiOff className="h-3.5 w-3.5" />
            Offline
          </div>
        );
    }
  }, [connectionState]);

  const summaryMetrics = useMemo(
    () => [
      {
        title: 'Active consultations',
        value: liveMetrics?.activeConsultations ?? 0,
        description: 'Currently in-session across clinics',
        icon: Activity,
      },
      {
        title: 'Waiting patients',
        value: liveMetrics?.waitingPatients ?? 0,
        description: 'Checked-in · waiting to be seen',
        icon: Users,
      },
      {
        title: 'Avg wait time',
        value: liveMetrics?.averageWaitTime ? `${liveMetrics.averageWaitTime} min` : '—',
        description: 'Rolling 30 min window',
        icon: LineChart,
      },
      {
        title: 'No-show rate',
        value: liveMetrics?.noShowRate ? `${liveMetrics.noShowRate}%` : '0%',
        description: 'Today vs weekly baseline',
        icon: ShieldCheck,
      },
      {
        title: 'Revenue today',
        value: liveMetrics?.revenueToday ? `₹${liveMetrics.revenueToday.toLocaleString()}` : '₹0',
        description: 'Captured payments · midnight reset',
        icon: DollarSign,
      },
      {
        title: 'Clinics pending activation',
        value: liveMetrics?.clinicsPending ?? 0,
        description: 'Awaiting compliance approvals',
        icon: Building2,
      },
    ],
    [liveMetrics],
  );

  if (!hydrated || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-3 text-center">
          <Skeleton className="mx-auto h-12 w-12 rounded-full" />
          <p className="text-sm text-muted-foreground">Preparing your admin workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <AdminShell
      title={`Welcome back, ${admin?.name}`}
      description="Review clinic onboarding, bookings, and compliance in one console."
      userName={admin?.name ?? admin?.email ?? 'Admin'}
      onSignOut={clearAuth}
      actions={
        <Button asChild size="sm" variant="outline">
          <Link href="mailto:support@illajwala.com">Email support</Link>
        </Button>
      }
    >
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Live ops pulse
            </h2>
            <p className="text-xs text-muted-foreground/90">
              Stay on top of today’s throughput and revenue in real time.
            </p>
          </div>
          {connectionBadge}
        </div>
        {metricsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : metricsError ? (
          <Alert variant="destructive" className="rounded-lg">
            <AlertTitle>Unable to load metrics</AlertTitle>
            <AlertDescription>
              We couldn&apos;t fetch the latest metrics. Please refresh or check the analytics
              service health.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {summaryMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <Card
                  key={metric.title}
                  className="rounded-lg border border-border bg-card shadow-sm"
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                      {metric.title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p className="text-2xl font-semibold text-foreground">{metric.value}</p>
                    <CardDescription>{metric.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
        <WaitlistOversightPanel />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
        <WaitlistPolicyConfig />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
        <BookingsTable />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
        <MultiClinicView />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
        <SLAAnalytics />
      </Suspense>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
            <OpsAnalyticsCharts />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
            <NotificationResendPanel />
          </Suspense>
        </div>
        <div className="space-y-6">
          <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
            <ProviderReviewQueue />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
            <ActivityLog />
          </Suspense>
        </div>
      </section>
    </AdminShell>
  );
}
