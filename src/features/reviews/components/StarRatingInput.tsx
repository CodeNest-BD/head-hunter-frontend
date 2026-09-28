"use client";

import { useState } from "react";
import { Star } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
}

const LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very good",
  5: "Excellent",
};

/** Five clickable stars with hover preview — the input half of RatingStars. */
export function StarRatingInput({ value, onChange }: StarRatingInputProps) {
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;

  return (
    <div className="flex items-center gap-2">
      <div
        role="radiogroup"
        aria-label="Rating"
        className="flex items-center gap-1"
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star === 1 ? "" : "s"} — ${LABELS[star]}`}
            onMouseEnter={() => setHovered(star)}
            onFocus={() => setHovered(star)}
            onBlur={() => setHovered(0)}
            onClick={() => onChange(star)}
            className="rounded-xs p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {/* The same gold as the read-only `RatingStars`, so a rating a
                company sets and the one it later reads back are one color. */}
            <Star
              className={cn(
                "size-7 transition-colors",
                star <= shown
                  ? "fill-[#e8b93b] text-[#e8b93b]"
                  : "fill-surface-sunken text-line-strong",
              )}
            />
          </button>
        ))}
      </div>
      <span className="min-w-[72px] text-sub font-[550] text-ink-muted">
        {shown > 0 ? LABELS[shown] : ""}
      </span>
    </div>
  );
}
