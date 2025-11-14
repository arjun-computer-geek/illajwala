'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@illajwala/ui';
import { LucideIcon } from 'lucide-react';

type MetricCardProps = {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
};

export const MetricCard = ({ title, value, description, icon: Icon }: MetricCardProps) => {
  return (
    <Card className="rounded-lg border border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};
