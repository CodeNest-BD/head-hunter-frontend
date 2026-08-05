import { cn } from "@/shared/libs/shadCnConfig";

interface GradientRuleProps {
  /**
   * "static" — a fixed transparent→blue→light-blue sweep (heading underline /
   * divider). "animated" — a highlight travels across a faint track (the mock's
   * progress bar).
   */
  variant?: "static" | "animated";
  className?: string;
}

const GRADIENT =
  "linear-gradient(90deg, transparent, #3b82f6, #60a5fa, transparent)";

/**
 * The mock's accent bar. Threads the brand's blue sweep through the UI as a
 * heading underline, divider, or loading indicator.
 */
export function GradientRule({
  variant = "static",
  className,
}: GradientRuleProps) {
  if (variant === "animated") {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "h-[3px] w-full overflow-hidden rounded-full bg-slate-400/15",
          className,
        )}
      >
        <div
          className="h-full w-2/5 rounded-full [animation:hh-bar_2.4s_ease-in-out_infinite]"
          style={{ background: GRADIENT }}
        />
      </div>
    );
  }
  return (
    <div
      aria-hidden="true"
      className={cn("h-px w-full rounded-full", className)}
      style={{ background: GRADIENT }}
    />
  );
}
