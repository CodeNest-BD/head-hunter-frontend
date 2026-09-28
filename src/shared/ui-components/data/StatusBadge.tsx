import { Pill, type PillTone } from "@/shared/ui-components/badges/Pill";

export interface StatusBadgeProps {
  label: string;
  /** The semantic tone for this status — the domain's own status→tone lookup
   * at the call site. This component only owns the shared pill recipe. */
  tone: PillTone;
  /** Drops the leading dot, for a pill that carries a value rather than a
   * state (e.g. "$0 — set a fee"). */
  plain?: boolean;
  className?: string;
}

/**
 * The canonical status pill — the reference's `.pill`. A status picks one of
 * seven semantic tones rather than a color, so a new status can never invent
 * an off-palette badge.
 */
export function StatusBadge({
  label,
  tone,
  plain,
  className,
}: StatusBadgeProps) {
  return (
    <Pill tone={tone} plain={plain} className={className}>
      {label}
    </Pill>
  );
}
