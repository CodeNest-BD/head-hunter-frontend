import { cn } from "@/shared/libs/shadCnConfig";

interface BrandGlowProps {
  /** Softer, app-wide ambient glow vs. the fuller hero treatment. */
  variant?: "ambient" | "hero";
  className?: string;
}

/**
 * The mock's signature: two slowly drifting blue radial glows (top-right +
 * bottom-left). Absolutely positioned and non-interactive — drop it as the
 * first child of any `relative`/`overflow-hidden` container to give a surface
 * the brand's ambient depth. Colors/curves are lifted verbatim from
 * `Under Development.html`.
 */
export function BrandGlow({ variant = "ambient", className }: BrandGlowProps) {
  const strong = variant === "hero";
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <div
        className="absolute -right-36 -top-44 h-[520px] w-[520px] rounded-full [animation:hh-drift_14s_ease-in-out_infinite]"
        style={{
          background: `radial-gradient(circle, rgba(37,99,235,${
            strong ? 0.22 : 0.14
          }), transparent 65%)`,
        }}
      />
      <div
        className="absolute -bottom-52 -left-40 h-[560px] w-[560px] rounded-full [animation:hh-drift2_18s_ease-in-out_infinite]"
        style={{
          background: `radial-gradient(circle, rgba(37,99,235,${
            strong ? 0.14 : 0.08
          }), transparent 65%)`,
        }}
      />
    </div>
  );
}
