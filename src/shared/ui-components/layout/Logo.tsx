import { cn } from "@/shared/libs/shadCnConfig";

interface LogoProps {
  /** Hide the wordmark, showing only the mark. */
  markOnly?: boolean;
  /** Wordmark ink: navy on light surfaces, white over navy panels. */
  tone?: "light" | "onDark";
  className?: string;
}

/**
 * HeadHunter brand lockup — the twin-chevron mark (mock blues #2050E0 / #5B8AF0)
 * plus the wordmark. Wordmark ink adapts to the surface.
 */
export function Logo({
  markOnly = false,
  tone = "light",
  className,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        width="26"
        height="20"
        viewBox="0 0 26 20"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <path d="M2 2l8 8-8 8V2z" fill="#2050E0" />
        <path d="M12 2l8 8-8 8V2z" fill="#5B8AF0" />
      </svg>
      {!markOnly && (
        <span
          className={cn(
            "font-heading text-[19px] font-extrabold leading-none tracking-[-0.02em]",
            tone === "onDark" ? "text-white" : "text-navy",
          )}
        >
          HeadHunter
        </span>
      )}
    </span>
  );
}
