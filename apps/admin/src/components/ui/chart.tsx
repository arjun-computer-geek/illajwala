"use client";

import {
  Tooltip,
  type TooltipProps as RechartsTooltipProps,
} from "recharts";
import { createContext, useContext, type ReactNode } from "react";
import clsx from "clsx";
import { format, parseISO } from "date-fns";

type ChartKey = string;

export type ChartConfig = Record<
  ChartKey,
  {
    label: string;
    color: string;
  }
>;

type ChartContainerProps = {
  children: ReactNode;
  className?: string;
  config: ChartConfig;
  style?: React.CSSProperties;
};

type ChartContextValue = {
  config: ChartConfig;
};

const ChartContext = createContext<ChartContextValue | null>(null);

export const useChartConfig = () => {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error("Chart components must be used within a <ChartContainer />");
  }
  return context;
};

export const ChartContainer = ({ children, className, config, style }: ChartContainerProps) => {
  const cssVars: React.CSSProperties = { ...style };
  let index = 1;

  for (const [, definition] of Object.entries(config)) {
    const variableName = `--chart-${index}`;
    (cssVars as Record<string, string>)[variableName] = definition.color;
    index += 1;
  }

  return (
    <ChartContext.Provider value={{ config }}>
      <div className={clsx("space-y-4", className)} style={cssVars}>
        {children}
      </div>
    </ChartContext.Provider>
  );
};

export type ChartTooltipContentProps = {
  valueFormatter?: (value: number, name: string) => ReactNode;
  dateFormatter?: (value: string) => ReactNode;
  className?: string;
} & RechartsTooltipProps<number, string>;

export const ChartTooltipContent = ({
  active,
  payload,
  label,
  valueFormatter,
  dateFormatter,
  className,
}: ChartTooltipContentProps) => {
  const { config } = useChartConfig();

  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const formattedLabel =
    typeof label === "string"
      ? dateFormatter?.(label) ?? safelyFormatDate(label)
      : label;

  return (
    <div className={clsx("rounded-md border border-border bg-card px-3 py-2 text-xs shadow-md", className)}>
      <div className="mb-2 font-medium text-foreground">{formattedLabel}</div>
      <div className="flex flex-col gap-1">
        {payload.map((item) => {
          const key = String(item.dataKey ?? "value");
          const definition = config[key];
          const color = item.color ?? definition?.color ?? "hsl(var(--primary))";
          const labelText = definition?.label ?? item.name ?? key;
          const numericValue = Number(item.value ?? 0);

          return (
            <div key={key} className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-muted-foreground">{labelText}</span>
              <span className="font-semibold text-foreground">
                {valueFormatter ? valueFormatter(numericValue, key) : numericValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ChartTooltip = Tooltip;

const safelyFormatDate = (input: string) => {
  try {
    return format(parseISO(input), "MMM d, yyyy");
  } catch (_error) {
    return input;
  }
};


