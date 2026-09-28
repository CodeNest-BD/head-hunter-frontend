import * as React from "react";
import { cn } from "@/shared/libs/shadCnConfig";

/**
 * A plain `<select>` wearing the reference's `.select`: the `.input` shell with
 * the native chevron swapped for the reference's own 12px caret, drawn 10px in
 * from the right edge.
 *
 * Kept alongside the Radix `Select` on purpose: this one forwards its ref to a
 * real form control, so `react-hook-form`'s `register` works on it directly and
 * a short list of options needs no portal, no open state, and no extra JS.
 */
const CARET =
  "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364708b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[right_10px_center] bg-no-repeat";

const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<"select">
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-9 w-full cursor-pointer appearance-none rounded-sm border border-line-strong bg-surface pl-[11px] pr-[30px] text-body text-ink transition-colors focus-visible:border-blue focus-visible:shadow-focus focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-ink-muted",
      CARET,
      className,
    )}
    {...props}
  />
));
NativeSelect.displayName = "NativeSelect";

export { NativeSelect };
