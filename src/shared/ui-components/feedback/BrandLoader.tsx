import { cn } from "@/shared/libs/shadCnConfig";

/**
 * The brand mark's blue. The final logo draws the ring, the arms and the core
 * in one colour, where the older mark paled the ring and left a hole through
 * the core.
 */
const MARK = "#2563EB";

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
 * Geometry matches `Logo` on a 100-unit square: ring at r=40 under an
 * 8.5-wide stroke, four arms 6 wide running r=28→50 so they cross the ring and
 * reach the mark's edge, and a solid core of r=18.5. Drawn rather than
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
            r="40"
            fill="none"
            stroke={MARK}
            strokeWidth="8.5"
          />
          {[0, 90, 180, 270].map((angle) => (
            <rect
              key={angle}
              x="47"
              y="0"
              width="6"
              height="22"
              fill={MARK}
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
        </g>
        {/* The core holds still — the mark stays sighted on its target. */}
        <circle cx="50" cy="50" r="18.5" fill={MARK} />
      </svg>

      {label !== null && (
        <span className="text-sub text-ink-muted">{label}</span>
      )}
    </div>
  );
}
