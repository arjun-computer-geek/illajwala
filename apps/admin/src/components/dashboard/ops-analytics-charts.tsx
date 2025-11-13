"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@illajwala/ui";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useOpsAnalyticsQuery } from "./queries/use-ops-analytics";

type ChartDefinition = {
  key: string;
  label: string;
  seriesLabel: string;
  color: string;
  data: Array<{ date: string; value: number }>;
  valueFormatter: (value: number) => string;
  yAxisFormatter: (value: number) => string;
  emptyState: string;
};

const DEFAULT_COLOR = "hsl(var(--chart-1))";

const toChartData = (
  series: Array<{ label: string; color?: string; points: Array<{ date: string; value: number }> }> | undefined
) => {
  if (!series || series.length === 0) {
    return {
      data: [] as Array<{ date: string; value: number }>,
      label: "",
      color: DEFAULT_COLOR,
    };
  }

  const [primary] = series;
  const data = primary.points.map((point) => ({
    date: point.date,
    value: point.value,
  }));

  return {
    data,
    label: primary.label,
    color: primary.color ?? DEFAULT_COLOR,
  };
};

export const OpsAnalyticsCharts = () => {
  const { data, isLoading, isError } = useOpsAnalyticsQuery();

  const charts = useMemo<ChartDefinition[]>(() => {
    const consultations = toChartData(data?.consultations);
    const revenue = toChartData(data?.revenue);
    const noShow = toChartData(data?.noShow);

    return [
      {
        key: "consultations",
        label: "Consultations",
        seriesLabel: consultations.label || "Consultations",
        color: consultations.color,
        data: consultations.data,
        valueFormatter: (value: number) => Math.round(value).toLocaleString(),
        yAxisFormatter: (value: number) => Math.round(value).toLocaleString(),
        emptyState: "No consultations recorded in this period.",
      },
      {
        key: "revenue",
        label: "Revenue",
        seriesLabel: revenue.label || "Revenue",
        color: revenue.color,
        data: revenue.data,
        valueFormatter: (value: number) => `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
        yAxisFormatter: (value: number) => `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
        emptyState: "No revenue has been captured during this period.",
      },
      {
        key: "noShow",
        label: "No-show rate",
        seriesLabel: noShow.label || "No-show rate",
        color: noShow.color,
        data: noShow.data,
        valueFormatter: (value: number) => `${value.toFixed(0)}%`,
        yAxisFormatter: (value: number) => `${value.toFixed(0)}%`,
        emptyState: "No-shows will appear here after enough visits are recorded.",
      },
    ];
  }, [data]);

  return (
    <Card className="rounded-lg border border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Ops analytics
        </CardTitle>
        <CardDescription>Track throughput, revenue, and patient behavior across the past weeks.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-48 rounded-full" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        ) : isError || !data ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
            Analytics data unavailable. Ensure the analytics service is publishing aggregates.
          </div>
        ) : (
          <Tabs defaultValue="consultations" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 rounded-full bg-muted/40 p-1 text-xs">
              {charts.map((chart) => (
                <TabsTrigger key={chart.key} value={chart.key} className="rounded-full">
                  {chart.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {charts.map((chart) => {
              const chartConfig = {
                value: {
                  label: chart.seriesLabel,
                  color: chart.color,
                },
              };

              return (
                <TabsContent key={chart.key} value={chart.key}>
                  <ChartContainer
                    config={chartConfig}
                    className="rounded-lg border border-border bg-background/40 p-4"
                  >
                    {chart.data.length === 0 ? (
                      <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
                        {chart.emptyState}
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={chart.data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                          <CartesianGrid strokeDasharray="4 4" className="stroke-muted/40" />
                          <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={24}
                            tickFormatter={(value) => format(parseISO(value), "MMM d")}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            width={56}
                            tickMargin={12}
                            tickFormatter={chart.yAxisFormatter}
                          />
                          <ChartTooltip
                            cursor={{ strokeDasharray: "3 3" }}
                            content={
                              <ChartTooltipContent
                                valueFormatter={(value) => chart.valueFormatter(value)}
                                dateFormatter={(value) => format(parseISO(value), "MMM d, yyyy")}
                              />
                            }
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke={chart.color}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </ChartContainer>
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

