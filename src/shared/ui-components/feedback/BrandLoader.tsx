import Image from "next/image";

import { cn } from "@/shared/libs/shadCnConfig";

/**
 * The full-page wait: the brand's crosshair mark inside a sweeping cobalt ring,
 * with the wordmark settling in beneath it.
 *
 * Used where the whole app is waiting — booting a session, resolving a route —
 * rather than for a slice of a page. A spinner is right for those cases (the
 * shape of what is coming is unknown, so there is nothing to trace with a
 * skeleton), but a bare circle on an empty canvas reads as a stall; the mark
 * says the product is loading, not that something has gone wrong.
 *
 * The ring is one conic gradient masked to its own edge, so it costs no extra
 * DOM and no SVG. Under `prefers-reduced-motion` every animation stops and the
 * lockup simply sits there, which is the honest still frame of the same thing.
 */
export function BrandLoader({
  /** Shown under the mark. Pass `null` for a bare lockup. */
  label = "Loading…",
  className,
}: {
  label?: string | null;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-4 bg-canvas",
        className,
      )}
    >
      <span className="relative flex size-16 items-center justify-center">
        {/* The sweeping ring. `mask` cuts the disc into a 2px band, so the
            gradient reads as an arc chasing the mark. */}
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-spin rounded-full motion-reduce:animate-none"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgb(var(--blue-rgb) / 0.15) 140deg, rgb(var(--blue-rgb)) 340deg, transparent 360deg)",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
            WebkitMask:
              "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
            animationDuration: "1.1s",
          }}
        />
        {/* A soft tint behind the mark so the ring reads as orbiting it. */}
        <span
          aria-hidden="true"
          className="absolute inset-1.5 rounded-full bg-tint/60"
        />
        <Image
          src="/assets/brand/logo-mark.png"
          alt=""
          aria-hidden="true"
          width={292}
          height={298}
          priority
          className="relative h-7 w-auto animate-[brand-pulse_1.8s_ease-in-out_infinite] select-none motion-reduce:animate-none"
        />
      </span>

      {label !== null && (
        <span className="text-sub text-ink-muted">{label}</span>
      )}
    </div>
  );
}
