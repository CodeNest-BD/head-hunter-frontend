import { cn } from "@/shared/libs/shadCnConfig";

export interface StatusBadgeProps {
  label: string;
  /** Per-status color classes — the domain-specific STATUS_STYLES lookup at
   * the call site. This component only owns the shared pill recipe. */
  className: string;
}

/** Canonical status pill — the color classes come from the caller's own
 * per-status style map; only the rendering recipe lives here. */
export function StatusBadge({ label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
    >
      {label}
    </span>
  );
}
