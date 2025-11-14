'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
} from '@illajwala/ui';
import { Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminAnalyticsApi } from '@/lib/api/analytics';
import { adminQueryKeys } from '@/lib/query-keys';

type SLAMetric = {
  label: string;
  value: number;
  target: number;
  status: 'met' | 'warning' | 'failed';
  description: string;
  icon: React.ElementType;
};

// Mock SLA data - replace with real API call when backend is ready
const mockSLAData = {
  verificationSLA: {
    average: 36, // hours
    target: 48,
    met: 95.2, // percentage
  },
  incidentResolution: {
    average: 2.5, // hours
    target: 4,
    met: 98.1,
  },
  payoutProcessing: {
    average: 24, // hours
    target: 48,
    met: 99.4,
  },
  clinicActivation: {
    average: 5, // days
    target: 7,
    met: 92.8,
  },
};

export const SLAAnalytics = () => {
  // TODO: Replace with real API call
  const { data, isLoading } = useQuery({
    queryKey: [...adminQueryKeys.opsMetrics(), 'sla'],
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockSLAData;
    },
    staleTime: 5 * 60_000, // 5 minutes
  });

  const metrics = useMemo<SLAMetric[]>(() => {
    if (!data) return [];

    const getStatus = (met: number): 'met' | 'warning' | 'failed' => {
      if (met >= 95) return 'met';
      if (met >= 85) return 'warning';
      return 'failed';
    };

    return [
      {
        label: 'Verification SLA',
        value: data.verificationSLA.average,
        target: data.verificationSLA.target,
        status: getStatus(data.verificationSLA.met),
        description: `Avg ${data.verificationSLA.average}h (target: ${data.verificationSLA.target}h)`,
        icon: CheckCircle2,
      },
      {
        label: 'Incident Resolution',
        value: data.incidentResolution.average,
        target: data.incidentResolution.target,
        status: getStatus(data.incidentResolution.met),
        description: `Avg ${data.incidentResolution.average}h (target: ${data.incidentResolution.target}h)`,
        icon: Clock,
      },
      {
        label: 'Payout Processing',
        value: data.payoutProcessing.average,
        target: data.payoutProcessing.target,
        status: getStatus(data.payoutProcessing.met),
        description: `Avg ${data.payoutProcessing.average}h (target: ${data.payoutProcessing.target}h)`,
        icon: AlertTriangle,
      },
      {
        label: 'Clinic Activation',
        value: data.clinicActivation.average,
        target: data.clinicActivation.target,
        status: getStatus(data.clinicActivation.met),
        description: `Avg ${data.clinicActivation.average} days (target: ${data.clinicActivation.target} days)`,
        icon: XCircle,
      },
    ];
  }, [data]);

  const statusVariant = (status: SLAMetric['status']) => {
    switch (status) {
      case 'met':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'warning':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'failed':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
    }
  };

  if (isLoading) {
    return (
      <Card className="rounded-lg border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            SLA Compliance
          </CardTitle>
          <CardDescription>Service level agreement metrics across operations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-32 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-lg border border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          SLA Compliance
        </CardTitle>
        <CardDescription>Service level agreement metrics across operations.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className={`rounded-lg border p-4 ${statusVariant(metric.status)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-[0.3em]">
                      {metric.label}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`rounded-full px-2 py-0.5 text-[10px] ${statusVariant(metric.status)}`}
                  >
                    {metric.status === 'met'
                      ? 'Met'
                      : metric.status === 'warning'
                        ? 'Warning'
                        : 'Failed'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-semibold">
                    {metric.value}
                    {metric.label.includes('Activation') ? ' days' : 'h'}
                  </p>
                  <p className="text-xs opacity-80">{metric.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
