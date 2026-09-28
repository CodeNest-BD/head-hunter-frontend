import { cn } from "@/shared/libs/shadCnConfig";
import { monogram } from "@/shared/ui-components/data/monogram";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

/** `.avatar` and its three modifiers — 26 / 32 / 40 / 52px on a rising radius. */
const SIZE: Record<AvatarSize, string> = {
  sm: "size-6.5 rounded-xs text-[10.5px]",
  md: "size-8 rounded-sm text-meta",
  lg: "size-10 rounded-[10px] text-block",
  xl: "size-13 rounded-[12px] text-[18px]",
};

/**
 * The reference's five deterministic avatar tints. A name always lands on the
 * same one, so the same person keeps the same color across every screen.
 */
const TINT = [
  "bg-[#2658cf]",
  "bg-[#0e7a8a]",
  "bg-[#6b4fa8]",
  "bg-[#0e7a43]",
  "bg-[#b0568a]",
] as const;

function tintFor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TINT[hash % TINT.length];
}

export interface AvatarProps {
  name: string;
  size?: AvatarSize;
  /**
   * `.avatar--logo` — a white chip with a hairline and navy ink, for an entity
   * that would otherwise carry an uploaded logo.
   */
  variant?: "tinted" | "logo";
  /** `.avatar--round` — a circle instead of a rounded square. */
  round?: boolean;
  className?: string;
}

/**
 * The reference's `.avatar`: a monogram chip in white on a deterministic tint.
 * Identity that has an uploaded image of its own goes through `CompanyLogo` or
 * `RecruiterPhoto`; this is the text-only fallback.
 */
export function Avatar({
  name,
  size = "md",
  variant = "tinted",
  round = false,
  className,
}: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-bold",
        SIZE[size],
        variant === "logo"
          ? "border border-line bg-surface text-navy"
          : cn("text-white", tintFor(name)),
        round && "rounded-full",
        className,
      )}
    >
      {monogram(name)}
    </span>
  );
}
