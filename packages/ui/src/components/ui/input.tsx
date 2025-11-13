import * as React from "react"

import { cn } from "@ui/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input/60 h-12 w-full min-w-0 rounded-2xl border bg-white/90 px-4 text-base shadow-[0_12px_26px_-24px_rgba(32,144,187,0.4)] transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-8 file:rounded-xl file:border-0 file:bg-transparent file:px-4 file:text-sm file:font-semibold disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-secondary/70",
        "focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-4",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
