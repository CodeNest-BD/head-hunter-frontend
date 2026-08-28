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
 */
export function Logo({
  tone = "light",
  size = "default",
  className,
}: LogoProps) {
  const onDark = tone === "onDark";
  const large = size === "lg";
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {/* The mark is the same coloured crosshair on every surface — the blue
          ring reads on both light and navy — so only the wordmark ink adapts. */}
      <Image
        src="/assets/brand/logo-mark.png"
        alt=""
        aria-hidden="true"
        width={292}
        height={298}
        priority
        className={cn("w-auto select-none", large ? "h-9" : "h-6 sm:h-7")}
      />
      <span
        className={cn(
          "font-heading font-extrabold leading-none tracking-[-0.02em]",
          large ? "text-[24px]" : "text-[17px] sm:text-[19px]",
        )}
      >
        <span className={onDark ? "text-white" : "text-navy"}>
          Head
          <span className={onDark ? "text-white" : "text-primary"}>-</span>
          Hunters
        </span>
        <span>
          <span className={onDark ? "text-white" : "text-navy"}>.</span>
          <span className={onDark ? "text-white/60" : "text-brand-gray-light"}>
            com
          </span>
        </span>
      </span>
    </span>
  );
}
