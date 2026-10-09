import * as React from "react";
import { cn } from "@/shared/libs/shadCnConfig";

/**
 * The design's field: 40px on an 8px radius with a `#DDE3EC` hairline, 14px
 * text and an `#8392A7` placeholder. Focus turns the border brand and lays a
 * translucent halo outside it.
 */
const INPUT_CLASSNAME =
  "flex h-10 w-full rounded-sm border border-line-strong bg-surface px-3 text-body text-ink transition-colors placeholder:text-ink-faint focus-visible:border-blue focus-visible:shadow-focus focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-ink-muted disabled:opacity-100";

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
