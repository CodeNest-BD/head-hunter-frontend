import * as React from "react";
import { cn } from "@/shared/libs/shadCnConfig";

/**
 * A surface: white, 10px radius, separated by a RING plus a 1px drop rather
 * than a border. `shadow-e1` carries both; adding `border` as well draws two
 * edges a pixel apart, which is what the design is avoiding.
 */
const Card = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-md bg-surface text-ink shadow-e1", className)}
      {...props}
    />
  ),
);
Card.displayName = "Card";

/**
 * The section head: `20px 24px 12px`, a 15px/600 title, and no rule under it.
 * The design separates a head from its body with space, not a line — a rule
 * belongs where content is genuinely tabular (the table's own band).
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-wrap items-center gap-x-2.5 gap-y-1 px-6 pb-3 pt-5",
      className,
    )}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

/** 15px/600 on full-strength ink. */
const CardTitle = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-card text-ink", className)} {...props} />
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

/** The body: 24px sides, 20px foot — the design's section padding. */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-6 pb-5", className)} {...props} />
));
CardContent.displayName = "CardContent";

/** The foot, ruled off with the design's hairline. */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-2 border-t border-line px-6 py-3",
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
