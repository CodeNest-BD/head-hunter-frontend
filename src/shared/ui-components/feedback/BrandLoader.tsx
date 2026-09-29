import { cn } from "@/shared/libs/shadCnConfig";

/**
 * The brand mark's own two blues. They predate the semantic palette — the mark
 * is a fixed asset, so it keeps its colours rather than drifting with the
 * theme.
 */
const RING = "#4F80E6";
const CORE = "#034AEF";

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
 * Geometry traces `public/assets/brand/logo-mark.png` on a 100-unit square:
 * ring at r=36 under an 8-wide stroke, four arms 8 wide running r=24→48 so they
 * cross the ring and poke past it, and a core ring spanning r=8→17.5. Redrawn
 * instead of animating the PNG because only part of it moves.
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
            r="36"
            fill="none"
            stroke={RING}
            strokeWidth="8"
          />
          {[0, 90, 180, 270].map((angle) => (
            <rect
              key={angle}
              x="46"
              y="2"
              width="8"
              height="24"
              fill={RING}
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
        </g>
        {/* The core holds still — the mark stays sighted on its target. Drawn
            as a stroked ring rather than a filled disc over a second one, so
            its hole is genuinely transparent and the mark sits on any
            background. */}
        <circle
          cx="50"
          cy="50"
          r="12.75"
          fill="none"
          stroke={CORE}
          strokeWidth="9.5"
        />
      </svg>

      {label !== null && (
        <span className="text-sub text-ink-muted">{label}</span>
      )}
    </div>
  );
}
