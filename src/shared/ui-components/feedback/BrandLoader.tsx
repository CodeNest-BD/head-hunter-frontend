import { cn } from "@/shared/libs/shadCnConfig";
import {
  ARM,
  ARM_ANGLES,
  CORE_R,
  MARK_BLUE,
  RING_DASH,
  RING_R,
  RING_ROTATE,
  RING_W,
} from "@/shared/ui-components/brand/brandMark";

/**
 * The full-page wait: the brand's crosshair, drawn rather than imported, so its
 * outer ring and arms can turn while the core stays put — the mark sighting a
 * target rather than the whole logo tumbling.
 *
 * Used where the whole app is waiting: booting a session, resolving a route. A
 * spinner is right for those (the shape of what is coming is unknown, so there
 * is nothing for a skeleton to trace), but a bare circle on an empty canvas
 * reads as a stall; the mark says the product is loading.
 *
 * Geometry and colour come from `brandMark`, the same constants `Logo` draws
 * from, so the spinner and the lockup cannot drift apart. Drawn rather than
 * imported because only part of it moves.
 */
export function BrandLoader({
  /** Shown under the mark. Pass `null` for a bare mark. */
  label = "Loading…",
  className,
}: {
  label?: string | null;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-4 bg-canvas",
        className,
      )}
    >
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        className="size-14 select-none"
      >
        {/* Ring and arms: the only part that turns. `origin-center` needs the
            transform box set to the fill box, or SVG rotates about the
            viewport's origin rather than the shape's. */}
        <g
          className="origin-center animate-spin [transform-box:fill-box] motion-reduce:animate-none"
          style={{ animationDuration: "1.6s" }}
        >
          <circle
            cx="50"
            cy="50"
            r={RING_R}
            fill="none"
            stroke={MARK_BLUE}
            strokeWidth={RING_W}
            strokeDasharray={RING_DASH}
            transform={`rotate(${RING_ROTATE} 50 50)`}
          />
          {ARM_ANGLES.map((angle) => (
            <rect
              key={angle}
              {...ARM}
              fill={MARK_BLUE}
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
        </g>
        {/* The core holds still — the mark stays sighted on its target. */}
        <circle cx="50" cy="50" r={CORE_R} fill={MARK_BLUE} />
      </svg>

      {label !== null && (
        <span className="text-sub text-ink-muted">{label}</span>
      )}
    </div>
  );
}
