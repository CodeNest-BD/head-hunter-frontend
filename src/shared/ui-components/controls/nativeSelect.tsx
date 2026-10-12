import * as React from "react";
import { cn } from "@/shared/libs/shadCnConfig";

/**
 * A plain `<select>` wearing the reference's `.select`: the `.input` shell with
 * the native chevron swapped for the reference's own 12px caret (`.select-caret`
 * in `globals.css`).
 *
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
      "select-caret flex h-9 w-full cursor-pointer appearance-none rounded-sm border border-line-strong bg-surface pl-[11px] pr-[30px] text-body text-ink transition-colors focus-visible:border-blue focus-visible:shadow-focus focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-ink-muted",
      className,
    )}
    {...props}
  />
));
NativeSelect.displayName = "NativeSelect";

export { NativeSelect };
