"use client";

import { cn } from "./lib/cn";

export type SkeletonProps = React.ComponentProps<"div">;

export const Skeleton = ({ className, ...props }: SkeletonProps) => (
  <div
    data-slot="skeleton"
    className={cn("bg-accent animate-pulse rounded-md", className)}
    {...props}
  />
);

