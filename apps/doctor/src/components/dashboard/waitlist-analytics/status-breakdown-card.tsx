'use client';

import { Card, CardContent, CardHeader, CardTitle, Badge } from '@illajwala/ui';
import { Calendar } from 'lucide-react';

type StatusBreakdownCardProps = {
  byStatus: Record<string, number>;
};

export const StatusBreakdownCard = ({ byStatus }: StatusBreakdownCardProps) => {
  return (
    <Card className="rounded-lg border border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Status Breakdown</CardTitle>
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Object.entries(byStatus).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between text-sm">
              <Badge variant="outline" className="capitalize">
                {status}
              </Badge>
              <span className="font-medium">{count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
