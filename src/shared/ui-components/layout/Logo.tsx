import Image from "next/image";

import { cn } from "@/shared/libs/shadCnConfig";

interface LogoProps {
  /** Wordmark ink: dark blue on light surfaces, white over navy panels. */
  tone?: "light" | "onDark";
  className?: string;
}

/**
 * Head-Hunters brand lockup: the client's crosshair mark
 * (public/assets/brand/logo-mark.png, cropped from the master logo so it stays
 * pixel-faithful) next to the "Head-Hunters.com" wordmark. The wordmark is live
 * text so it stays crisp and the colours match the master exactly — navy
 * "Head-Hunters" with a primary-blue hyphen and a navy period, then a grey
 * "com". Height can be overridden via `className` (e.g. `h-7`).
 */
export function Logo({ tone = "light", className }: LogoProps) {
  const onDark = tone === "onDark";
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/assets/brand/logo-mark.png"
        alt=""
        aria-hidden="true"
        width={292}
        height={298}
        priority
        className={cn(
          "h-7 w-auto select-none",
          // On navy panels the coloured mark loses contrast; render it white.
          onDark && "brightness-0 invert",
        )}
      />
      <span className="font-heading text-[19px] font-extrabold leading-none tracking-[-0.02em]">
        <span className={onDark ? "text-white" : "text-navy"}>
          Head
          <span className={onDark ? "text-white" : "text-primary"}>-</span>
          Hunters.
        </span>
        <span className={onDark ? "text-white/60" : "text-brand-gray-light"}>
          com
        </span>
      </span>
    </span>
  );
}
