import { cn } from "@/shared/libs/shadCnConfig";

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
 * Geometry on a 100-unit square, shared with `BrandLoader` and `icon.svg`,
 * measured off the supplied artwork: ring at r=40 under an 8.5-wide stroke,
 * four arms 6 wide running r=28→50 so they cross the ring and reach the mark's
 * edge, and a solid core of r=18.5.
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
          "shrink-0 select-none text-blue",
          large ? "size-[40px]" : "size-[26px] sm:size-[32px]",
        )}
      >
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8.5"
        />
        {[0, 90, 180, 270].map((angle) => (
          <rect
            key={angle}
            x="47"
            y="0"
            width="6"
            height="22"
            fill="currentColor"
            transform={`rotate(${angle} 50 50)`}
          />
        ))}
        {/* Solid, not a ring: the final logo fills the core, where the older
            mark left a hole through it. */}
        <circle cx="50" cy="50" r="18.5" fill="currentColor" />
      </svg>
      <span
        className={cn(
          "font-heading font-[750] leading-none tracking-[-0.015em]",
          large ? "text-[21px]" : "text-[14.5px] sm:text-[17px]",
        )}
      >
        <span className={onDark ? "text-white" : "text-navy"}>
          head-hunters
        </span>
        <span className={onDark ? "text-white/70" : "text-blue"}>.com</span>
      </span>
    </span>
  );
}
