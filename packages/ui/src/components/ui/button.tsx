import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@ui/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--gradient-primary)] text-primary-foreground shadow-[0_14px_30px_-18px_rgba(32,144,187,0.45)] hover:shadow-[0_18px_42px_-18px_rgba(32,144,187,0.55)]",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-transparent bg-background text-primary shadow-[inset_0_0_0_1px_rgba(44,167,163,0.45)] hover:bg-primary/10 hover:shadow-[inset_0_0_0_1px_rgba(30,144,187,0.55)] dark:bg-secondary",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-[0_10px_24px_-20px_rgba(30,144,187,0.45)]",
        ghost:
          "hover:bg-muted/70 hover:text-foreground dark:hover:bg-secondary/60",
        link: "text-primary underline-offset-4 hover:underline focus-visible:ring-0",
      },
      size: {
        default: "h-11 px-6 py-2.5 has-[>svg]:px-5",
        sm: "h-9 rounded-xl gap-1.5 px-4 has-[>svg]:px-3.5 text-xs font-medium",
        lg: "h-12 rounded-[1.4rem] px-8 has-[>svg]:px-6 text-base",
        icon: "size-11 rounded-2xl",
        "icon-sm": "size-9 rounded-xl",
        "icon-lg": "size-12 rounded-[1.4rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
