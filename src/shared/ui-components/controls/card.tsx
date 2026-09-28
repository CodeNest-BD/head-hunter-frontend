import * as React from "react";
import { cn } from "@/shared/libs/shadCnConfig";

/**
 * The reference's `.card`: a white surface on a 10px radius with a `line`
 * hairline and a 1px crisp lift — never a diffuse shadow. Its head, body and
 * foot are ruled off from each other rather than separated by padding alone.
 */
const Card = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-md border border-line bg-surface text-ink shadow-e1",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

/**
 * `.card__head` — a 12px/16px row under a hairline rule, so a title and its
 * trailing count chip or link share a baseline. It wraps, and `CardDescription`
 * claims a full row of its own, so a head that stacks a subtitle under the
 * title still reads as two lines.
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-line px-4 py-3",
      className,
    )}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

/** `.t-card` — 15px/650 on full-strength ink. */
const CardTitle = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-card font-[650] text-ink", className)}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-full text-meta text-ink-muted", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

/** `.card__body` — an even 16px on all sides. */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4", className)} {...props} />
));
CardContent.displayName = "CardContent";

/** `.card__foot` — 10px/16px above a hairline rule. */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-2 border-t border-line px-4 py-2.5",
      className,
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
