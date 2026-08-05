import { cn } from "@/shared/libs/shadCnConfig";

interface BrandGlowProps {
  /** Kept for API compatibility; both render the same subtle navy-panel glow. */
  variant?: "ambient" | "hero";
  className?: string;
}

/**
 * A subtle blue radial depth for the navy hero/auth panels (the mock's dark
 * sections). Non-interactive; drop as the first child of a `relative
 * overflow-hidden` navy container. On light surfaces it's effectively invisible,
 * so it's safe to leave in place but is meant for navy panels.
 */
export function BrandGlow({ className }: BrandGlowProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <div
        className="absolute -right-32 -top-40 h-[440px] w-[440px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(91,138,240,0.18), transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-44 -left-32 h-[400px] w-[400px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(41,102,232,0.14), transparent 70%)",
        }}
      />
    </div>
  );
}
