'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@illajwala/ui';
import { BarChart3, TrendingUp, Clock, Users, CheckCircle2, XCircle } from 'lucide-react';
import { doctorWaitlistsApi } from '../../lib/api/waitlists';
import { useDoctorAuth } from '../../hooks/use-auth';
import { MetricCard } from './waitlist-analytics/metric-card';
import { DateRangeFilter } from './waitlist-analytics/date-range-filter';
import { EntriesTimelineChart } from './waitlist-analytics/entries-timeline-chart';
import { StatusBreakdownCard } from './waitlist-analytics/status-breakdown-card';
import { AnalyticsLoadingSkeleton } from './waitlist-analytics/analytics-loading-skeleton';
import { formatHours } from './waitlist-analytics/utils';

type WaitlistAnalytics = {
  totalEntries: number;
  byStatus: Record<string, number>;
  averageWaitTime: number;
  averageTimeToPromotion: number;
  promotionRate: number;
  expiryRate: number;
  cancellationRate: number;
  currentQueueSize: number;
  peakQueueSize: number;
  entriesByDay: Array<{ date: string; count: number }>;
  statusTransitions: Array<{ from: string; to: string; count: number }>;
};

type AnalyticsState =
  | { kind: 'idle' | 'loading' }
  | { kind: 'ready'; data: WaitlistAnalytics }
  | { kind: 'error'; error: string };

export const WaitlistAnalytics = () => {
  const { doctor } = useDoctorAuth();
  const [state, setState] = useState<AnalyticsState>({ kind: 'idle' });
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});

  const fetchAnalytics = useCallback(async () => {
    if (!doctor) {
      return;
    }
    setState({ kind: 'loading' });
    try {
      const response = await doctorWaitlistsApi.getAnalytics({
        ...(dateRange.start ? { startDate: dateRange.start } : {}),
        ...(dateRange.end ? { endDate: dateRange.end } : {}),
      });
      setState({ kind: 'ready', data: response.data });
    } catch (error) {
      console.error('[doctor] Failed to fetch waitlist analytics', error);
      setState({
        kind: 'error',
        error: 'Unable to load analytics. Please try again.',
      });
    }
  }, [doctor, dateRange]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  if (state.kind === 'loading' || state.kind === 'idle') {
    return <AnalyticsLoadingSkeleton />;
  }

  if (state.kind === 'error') {
    return (
      <Alert variant="destructive" className="rounded-lg">
        <AlertTitle>Analytics unavailable</AlertTitle>
        <AlertDescription>{state.error}</AlertDescription>
      </Alert>
    );
  }

  if (state.kind !== 'ready') {
    return null;
  }

  const { data } = state;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Waitlist Analytics</h2>
          <p className="text-muted-foreground">Performance metrics and insights</p>
        </div>
        <DateRangeFilter
          startDate={dateRange.start}
          endDate={dateRange.end}
          onStartDateChange={(date) => setDateRange((prev) => ({ ...prev, start: date }))}
          onEndDateChange={(date) => setDateRange((prev) => ({ ...prev, end: date }))}
          onRefresh={() => void fetchAnalytics()}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Entries"
          value={data.totalEntries}
          description="All time"
          icon={Users}
        />
        <MetricCard
          title="Current Queue"
          value={data.currentQueueSize}
          description={`Peak: ${data.peakQueueSize}`}
          icon={BarChart3}
        />
        <MetricCard
          title="Avg Wait Time"
          value={formatHours(data.averageWaitTime)}
          description="Active entries"
          icon={Clock}
        />
        <MetricCard
          title="Time to Promotion"
          value={formatHours(data.averageTimeToPromotion)}
          description="Average"
          icon={TrendingUp}
        />
        <MetricCard
          title="Promotion Rate"
          value={`${Math.round(data.promotionRate)}%`}
          description="Success rate"
          icon={CheckCircle2}
        />
        <MetricCard
          title="Expiry Rate"
          value={`${Math.round(data.expiryRate)}%`}
          description="Expired entries"
          icon={XCircle}
        />
        <MetricCard
          title="Cancellation Rate"
          value={`${Math.round(data.cancellationRate)}%`}
          description="Cancelled entries"
          icon={XCircle}
        />
        <StatusBreakdownCard byStatus={data.byStatus} />
      </div>

      <EntriesTimelineChart entriesByDay={data.entriesByDay} />
    </div>
  );
};
