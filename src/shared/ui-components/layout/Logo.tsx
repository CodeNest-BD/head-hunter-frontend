import { cn } from "@/shared/libs/shadCnConfig";

interface LogoProps {
  /** Hide the wordmark, showing only the mark (e.g. a collapsed sidebar). */
  markOnly?: boolean;
  className?: string;
}

/**
 * HeadHunter brand lockup — the twin-chevron mark from the brand mock plus the
 * wordmark. The mark scales with `currentColor`-independent brand blue so it
 * reads consistently on the dark canvas.
 */
export function Logo({ markOnly = false, className }: LogoProps) {
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
        <path d="M2 2l8 8-8 8V2z" fill="#2563eb" />
        <path d="M12 2l8 8-8 8V2z" fill="#3b82f6" />
      </svg>
      {!markOnly && (
        <span className="font-heading text-[19px] font-extrabold leading-none tracking-[-0.02em] text-white">
          HeadHunter
        </span>
      )}
    </span>
  );
}
