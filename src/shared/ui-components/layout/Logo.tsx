import { cn } from "@/shared/libs/shadCnConfig";
import {
  ARM,
  ARM_ANGLES,
  CORE_R,
  MARK_BLUE,
  MARK_NAVY,
  RING_DASH,
  RING_R,
  RING_ROTATE,
  RING_W,
} from "@/shared/ui-components/brand/brandMark";

interface LogoProps {
  /** Wordmark ink: dark blue on light surfaces, white over navy panels. */
  tone?: "light" | "onDark";
  /**
   * "default" for nav bars, where the lockup shares a cramped row and shrinks
   * on a phone; "lg" where the brand is the point (the auth pages), and a
   * nav-sized lockup reads as an afterthought.
   */
  size?: "default" | "lg";
  className?: string;
}

/**
 * Head-Hunters brand lockup: the crosshair mark beside the "head-hunters.com"
 * wordmark, matching the final logo the client supplied.
 *
 * The mark is drawn rather than imported. The supplied file is a JPEG — lossy,
 * so its edges carry compression noise and its white background cannot sit on
 * a navy panel — and the shape is four arms, a ring and a dot. Drawn, it stays
 * sharp from the 26px nav lockup to the 40px auth one, costs no request, and
 * takes its colour from the brand token rather than a baked pixel value.
 *
 * Geometry and colour both come from `brandMark`, measured off the supplied
 * artwork — including the breaks in the ring that each bar sits inside, which
 * are what make it read as a crosshair rather than a wheel.
 *
 * The wordmark is live text so it stays crisp and the colours match exactly —
 * navy "head-hunters" and a primary-blue ".com". Height comes from `size`;
 * `className` styles the wrapper, so a height utility on it would not reach
 * the mark or the wordmark.
 *
 * The default size steps down below `sm` so the full ".com" still fits beside
 * a hamburger and three actions on a 360px phone — the whole point of keeping
 * the suffix is that it is readable, not ellipsised.
 */
export function Logo({
  tone = "light",
  size = "default",
  className,
}: LogoProps) {
  const onDark = tone === "onDark";
  const large = size === "lg";
  return (
    <span className={cn("inline-flex items-center gap-[9px]", className)}>
      {/* The mark keeps its blue on every surface — it reads on both light and
          navy — so only the wordmark ink adapts. */}
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        className={cn(
          "shrink-0 select-none",
          large ? "size-[40px]" : "size-[26px] sm:size-[32px]",
        )}
      >
        {/* Four arcs, not a closed ring: the dash pattern leaves a break on
            each axis and the bar sits inside it, clear of both arc ends. */}
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
        {/* Solid, not a ring: the final logo fills the core, where the older
            mark left a hole through it. */}
        <circle cx="50" cy="50" r={CORE_R} fill={MARK_BLUE} />
      </svg>
      <span
        className={cn(
          "font-heading font-[750] leading-none tracking-[-0.015em]",
          onDark && "text-white",
          large ? "text-[21px]" : "text-[14.5px] sm:text-[17px]",
        )}
      >
        <span style={onDark ? undefined : { color: MARK_NAVY }}>
          head-hunters
        </span>
        <span style={onDark ? undefined : { color: MARK_BLUE }}>.com</span>
      </span>
    </span>
  );
}
