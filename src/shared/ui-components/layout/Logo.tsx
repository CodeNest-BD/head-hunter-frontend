import Image from "next/image";

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
 * Head-Hunters brand lockup: the client's crosshair mark
 * (public/assets/brand/logo-mark.png, cropped from the master logo so it stays
 * pixel-faithful) next to the "Head-Hunters.com" wordmark. The wordmark is live
 * text so it stays crisp and the colours match the master exactly — navy
 * "Head-Hunters" with a primary-blue hyphen and a navy period, then a grey
 * "com". Height comes from `size` — `className` styles the wrapper, so a
 * height utility on it would not reach the mark or the wordmark.
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
    <span
      className={cn("inline-flex items-center gap-[9px]", className)}
    >
      {/* The mark is the same coloured crosshair on every surface — the blue
          ring reads on both light and navy — so only the wordmark ink adapts. */}
      <Image
        src="/assets/brand/logo-mark.png"
        alt=""
        aria-hidden="true"
        width={292}
        height={298}
        priority
        className={cn("w-auto select-none", large ? "h-[30px]" : "h-[26px]")}
      />
      <span
        className={cn(
          "font-heading font-[750] leading-none tracking-[-0.015em]",
          large ? "text-[15px]" : "text-[14.5px]",
        )}
      >
        <span className={onDark ? "text-white" : "text-navy"}>
          Head
          <span className={onDark ? "text-white" : "text-blue"}>-</span>
          Hunters
        </span>
        <span>
          <span className={onDark ? "text-white" : "text-navy"}>.</span>
          <span className={onDark ? "text-white/60" : "text-ink-faint"}>
            com
          </span>
        </span>
      </span>
    </span>
  );
}
