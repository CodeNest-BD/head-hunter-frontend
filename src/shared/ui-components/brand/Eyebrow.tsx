import type { ReactNode } from "react";
import { cn } from "@/shared/libs/shadCnConfig";

interface EyebrowProps {
  children: ReactNode;
  /** "brand" on light surfaces (blue), "onDark" over navy panels (light blue). */
  tone?: "brand" | "onDark";
  className?: string;
}

/**
 * Section eyebrow copied from the "HeadHunter Platform v2" mock: a small,
 * uppercase, wide-tracked caption (no pill). Blue on light surfaces; the mock's
 * #8FB0F5 over navy hero panels.
 */
export function Eyebrow({ children, tone = "brand", className }: EyebrowProps) {
  return (
    <span
      className={cn(
        "inline-block text-[12px] font-semibold uppercase tracking-[0.1em]",
        tone === "onDark" ? "text-[#8FB0F5]" : "text-primary",
        className,
      )}
    >
      {children}
    </span>
  );
}
