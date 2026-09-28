import * as React from "react";
import { cn } from "@/shared/libs/shadCnConfig";

/**
 * The reference's `.input`: a 36px field on an 8px radius with a `line-strong`
 * hairline, 13.5px text, and a focus state that turns the border cobalt and
 * lays a 3px translucent halo outside it.
 */
const INPUT_CLASSNAME =
  "flex h-9 w-full rounded-sm border border-line-strong bg-surface px-[11px] text-body text-ink transition-colors placeholder:text-ink-faint focus-visible:border-blue focus-visible:shadow-focus focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-ink-muted disabled:opacity-100";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(INPUT_CLASSNAME, className)}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input, INPUT_CLASSNAME };
