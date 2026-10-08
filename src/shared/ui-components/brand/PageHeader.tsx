import type { ReactNode } from "react";
import { cn } from "@/shared/libs/shadCnConfig";
import { TONE_DOT, type PillTone } from "@/shared/ui-components/badges/Pill";

/** A headline figure shown as a stat card on the right of the header. */
export interface HeaderMetric {
  readonly label: string;
  readonly value: ReactNode;
  /**
   * The dot's colour, from the same tone table the row badges use — so
   * "Suspended" is the identical red in the card and on every row it counts.
   * Left unset for a plain total, which is a figure rather than a state.
   */
  readonly tone?: PillTone;
}

interface PageHeaderProps {
  /** Small caption above the title — the reference's crumb line. */
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Sits beside the title — the reference's inline count chip or status pill. */
  badge?: ReactNode;
  /** Right-side headline figures, rendered as stat cards. */
  metrics?: readonly HeaderMetric[];
  /** Right-aligned actions (e.g. a primary button). Sits after the metrics. */
  actions?: ReactNode;
  /** Extra content under the header (e.g. filters). */
  children?: ReactNode;
  className?: string;
}

/**
 * The reference's `.pagehead`, and the only page header in the app: a 20px/700
 * title with an optional inline chip, a 13px muted line of explanation beneath
 * it, and the page's metrics and actions pushed to the right edge.
 *
 * No rule and no banner card — the blue-grey canvas already separates the
 * header from the white surfaces below it.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  badge,
  metrics,
  actions,
  children,
  className,
}: PageHeaderProps) {
  const hasAside = Boolean(metrics?.length) || Boolean(actions);

  return (
    // No own bottom margin: every page places this inside a flex column whose
    // `gap` owns the spacing — a margin here would stack on top of it.
    <header className={cn(className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-[3px] text-meta text-ink-faint">{eyebrow}</p>
          )}
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-page font-bold text-ink">{title}</h1>
            {badge}
          </div>
          {subtitle && (
            <p className="mt-[3px] max-w-3xl text-sub text-ink-muted">
              {subtitle}
            </p>
          )}
        </div>

        {hasAside && (
          <div className="flex flex-wrap items-center gap-2.5 sm:ml-auto sm:shrink-0">
            {/* Cards rather than bare label/value pairs: these are the page's
                headline figures, and a row of them against the title needs an
                edge to read as three answers instead of six loose words. */}
            {metrics?.map((metric) => (
              <div
                key={metric.label}
                className="min-w-[96px] rounded-sm border border-line bg-surface px-3 py-2 shadow-e1"
              >
                <p className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-[7px] shrink-0 rounded-full",
                      TONE_DOT[metric.tone ?? "neutral"],
                    )}
                  />
                  <span className="text-page font-bold tabular-nums text-ink">
                    {metric.value}
                  </span>
                </p>
                <p className="mt-0.5 text-meta text-ink-muted">
                  {metric.label}
                </p>
              </div>
            ))}
            {actions && (
              <div className="flex flex-wrap items-center gap-2">{actions}</div>
            )}
          </div>
        )}
      </div>
      {children}
    </header>
  );
}
