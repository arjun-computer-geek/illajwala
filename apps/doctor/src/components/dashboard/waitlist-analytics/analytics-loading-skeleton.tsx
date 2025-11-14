'use client';

import { Card, CardHeader, Skeleton } from '@illajwala/ui';

export const AnalyticsLoadingSkeleton = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="rounded-lg border border-border bg-card shadow-sm">
          <CardHeader>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16 mt-2" />
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};
