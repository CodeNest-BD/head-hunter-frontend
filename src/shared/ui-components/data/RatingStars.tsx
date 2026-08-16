import { Star } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";

interface RatingStarsProps {
  /** Average rating 1–5, or null when unreviewed. */
  value: number | null;
  /** Number of reviews behind the average; shown as "(n)" when provided. */
  count?: number;
  /** Compact renders smaller stars for table rows. */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Fiverr-style star readout: five stars filled to the average, the numeric
 * value, and optionally the review count. Unreviewed renders a muted "New".
 */
export function RatingStars({
  value,
  count,
  size = "sm",
  className,
}: RatingStarsProps) {
  const starClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  if (value === null) {
    return (
      <span
        className={cn("text-xs font-medium text-muted-foreground", className)}
      >
        New — no reviews yet
      </span>
    );
  }

  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      aria-label={`Rated ${value.toFixed(1)} out of 5${
        count !== undefined
          ? ` from ${count} review${count === 1 ? "" : "s"}`
          : ""
      }`}
    >
      <span aria-hidden="true" className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              starClass,
              star <= Math.round(value)
                ? "fill-[#F5A623] text-[#F5A623]"
                : "fill-muted text-muted",
            )}
          />
        ))}
      </span>
      <span
        className={cn(
          "font-semibold text-foreground",
          size === "sm" ? "text-xs" : "text-sm",
        )}
      >
        {value.toFixed(1)}
      </span>
      {count !== undefined && (
        <span
          className={cn(
            "text-muted-foreground",
            size === "sm" ? "text-xs" : "text-sm",
          )}
        >
          ({count})
        </span>
      )}
    </span>
  );
}
