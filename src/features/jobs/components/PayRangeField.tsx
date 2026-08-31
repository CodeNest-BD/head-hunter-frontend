"use client";

import { Slider } from "@/shared/ui-components/controls/slider";
import { formatMinor } from "@/shared/utils/money";

/**
 * The slider's span, in major units, per rate period. A yearly band and an
 * hourly one cannot share a scale — $200/yr and $200/hr are different worlds.
 */
const SLIDER_RANGE: Record<string, { max: number; step: number }> = {
  per_year: { max: 500_000, step: 5_000 },
  per_hour: { max: 500, step: 5 },
};

const DEFAULT_RANGE = SLIDER_RANGE.per_year;

/** Clamps a typed figure onto the slider's scale so the thumbs stay on track
 * even when someone types past the top of it. */
function toThumb(value: string, max: number, fallback: number): number {
  const parsed = Number(value);
  if (value.trim() === "" || !Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 0), max);
}

interface PayRangeFieldProps {
  min: string;
  max: string;
  onChange: (next: { min: string; max: string }) => void;
  /** Scales the track: a yearly band and an hourly rate differ 1000-fold. */
  ratePeriod: string;
  /** The two money inputs, kept as the precise way to enter a figure. */
  children: React.ReactNode;
}

/**
 * Pay range as a two-thumb slider over the same values the money inputs hold,
 * so dragging and typing are two views of one range. The slider is for framing
 * a band at a glance; the inputs stay because a six-figure salary is not
 * something anyone should have to land on by dragging.
 */
export function PayRangeField({
  min,
  max,
  onChange,
  ratePeriod,
  children,
}: PayRangeFieldProps) {
  const scale = SLIDER_RANGE[ratePeriod] ?? DEFAULT_RANGE;
  const low = toThumb(min, scale.max, 0);
  const high = toThumb(max, scale.max, scale.max);

  return (
    <div className="flex flex-col gap-3">
      {children}
      <div className="flex flex-col gap-1.5 px-1 pt-1">
        <Slider
          value={[low, Math.max(low, high)]}
          min={0}
          max={scale.max}
          step={scale.step}
          minStepsBetweenThumbs={1}
          aria-label="Pay range"
          onValueChange={([nextLow, nextHigh]) =>
            onChange({ min: String(nextLow), max: String(nextHigh) })
          }
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Min {formatMinor(low * 100)}</span>
          <span>
            Max {formatMinor(Math.max(low, high) * 100)}
            {high >= scale.max ? "+" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
