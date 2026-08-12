import * as React from "react";
import { cn } from "@/shared/libs/shadCnConfig";

/**
 * A plain `<select>` wearing the same border, height and focus ring as `Input`.
 * Kept alongside the Radix `Select` on purpose: this one forwards its ref to a
 * real form control, so `react-hook-form`'s `register` works on it directly and
 * a short list of options needs no portal, no open state, and no extra JS.
 */
const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<"select">
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-9 w-full rounded-md border border-input bg-card px-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
NativeSelect.displayName = "NativeSelect";

export { NativeSelect };
