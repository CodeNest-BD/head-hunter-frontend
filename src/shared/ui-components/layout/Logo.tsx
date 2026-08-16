import { cn } from "@/shared/libs/shadCnConfig";

interface LogoProps {
  /** Hide the wordmark, showing only the mark. */
  markOnly?: boolean;
  /** Wordmark ink: dark blue on light surfaces, white over navy panels. */
  tone?: "light" | "onDark";
  className?: string;
}

/**
 * Head-Hunters brand lockup, drawn from the client's logo file
 * (public/assets/brand/logo.png): a crosshair mark — light-blue ring and
 * ticks (#4F80E6) around a primary-blue core (#034AEF) — next to the
 * "Head-Hunters" wordmark with a grey ".com". Wordmark ink adapts to the
 * surface.
 */
export function Logo({
  markOnly = false,
  tone = "light",
  className,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Ring */}
        <circle
          cx="12"
          cy="12"
          r="7.5"
          stroke="#4F80E6"
          strokeWidth="2.4"
          fill="none"
        />
        {/* Ticks */}
        <path
          d="M12 0.6v3.2M12 20.2v3.2M0.6 12h3.2M20.2 12h3.2"
          stroke="#4F80E6"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        {/* Core */}
        <circle cx="12" cy="12" r="4.4" fill="#034AEF" />
        <circle cx="12" cy="12" r="1.9" fill="#FDFEFE" />
      </svg>
      {!markOnly && (
        <span className="font-heading text-[19px] font-extrabold leading-none tracking-[-0.02em]">
          <span className={tone === "onDark" ? "text-white" : "text-navy"}>
            Head-Hunters
          </span>
          <span
            className={
              tone === "onDark" ? "text-white/60" : "text-brand-gray-light"
            }
          >
            .com
          </span>
        </span>
      )}
    </span>
  );
}
