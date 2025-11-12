"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./lib/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[1.2rem] text-sm font-semibold tracking-tight transition-[transform,background,box-shadow,color] duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/20 aria-invalid:border-destructive dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(135deg,hsl(var(--brand-hero-from))_0%,hsl(var(--brand-hero-to))_100%)] text-primary-foreground shadow-[0_16px_40px_-22px_hsl(var(--brand-hero-to)/0.6)] hover:brightness-[1.05] hover:shadow-[0_18px_44px_-20px_hsl(var(--brand-hero-to)/0.55)] hover:-translate-y-0.5",
        brand:
          "bg-primary text-primary-foreground shadow-[0_16px_36px_-22px_hsl(var(--primary)/0.55)] hover:-translate-y-0.5 hover:bg-[hsl(var(--brand-cta-hover))] hover:brightness-105",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_12px_32px_-22px_hsl(var(--destructive)/0.4)] hover:bg-destructive/90 hover:-translate-y-0.5 focus-visible:ring-destructive/25 dark:focus-visible:ring-destructive/40 dark:bg-destructive/80",
        outline:
          "border border-border/70 bg-white/70 text-foreground shadow-[0_10px_26px_-18px_hsl(var(--primary)/0.25)] hover:bg-accent hover:text-accent-foreground hover:-translate-y-0.5 dark:border-border/60 dark:bg-background/40",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_14px_30px_-20px_hsl(var(--secondary)/0.45)] hover:bg-secondary/80 hover:brightness-105 hover:-translate-y-0.5",
        ghost:
          "bg-transparent text-foreground hover:bg-accent/70 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 has-[>svg]:px-5",
        sm: "h-10 gap-1.5 px-5",
        lg: "h-12 px-7 text-base has-[>svg]:px-6",
        icon: "size-11",
        "icon-sm": "size-10",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

