'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@illajwala/ui';

type EntriesTimelineChartProps = {
  entriesByDay: Array<{ date: string; count: number }>;
};

export const EntriesTimelineChart = ({ entriesByDay }: EntriesTimelineChartProps) => {
  if (entriesByDay.length === 0) {
    return null;
  }

  const maxCount = Math.max(...entriesByDay.map((d) => d.count));

  return (
    <Card className="rounded-lg border border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle>Entries Over Time</CardTitle>
        <CardDescription>Daily waitlist entry volume</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entriesByDay.slice(-14).map((day) => (
            <div key={day.date} className="flex items-center gap-4">
              <div className="w-24 text-xs text-muted-foreground">
                {new Date(day.date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
              <div className="flex-1">
                <div
                  className="h-6 rounded bg-primary/20 flex items-center justify-end pr-2"
                  style={{ width: `${(day.count / maxCount) * 100}%` }}
                >
                  {day.count > 0 && <span className="text-xs font-medium">{day.count}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
