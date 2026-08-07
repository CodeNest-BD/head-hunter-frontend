import { cn } from "@/shared/libs/shadCnConfig";

interface GradientRuleProps {
  /** Kept for API compatibility; both render a clean hairline divider. */
  variant?: "static" | "animated";
  className?: string;
}

/**
 * A hairline divider. (The prior blue gradient sweep belonged to the old dark
 * mock; the Head-Hunters Platform design uses clean hairlines.)
 */
export function GradientRule({ className }: GradientRuleProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("h-px w-full bg-border", className)}
    />
  );
}
