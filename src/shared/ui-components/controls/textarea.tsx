import * as React from "react";
import { cn } from "@/shared/libs/shadCnConfig";

/** The reference's `.textarea`: the `.input` recipe at an 84px floor, with
 * 9px/11px padding and a 1.5 line-height for multi-line copy. */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[84px] w-full resize-y rounded-sm border border-line-strong bg-surface px-[11px] py-[9px] text-body leading-normal text-ink transition-colors placeholder:text-ink-faint focus-visible:border-blue focus-visible:shadow-focus focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-ink-muted",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
