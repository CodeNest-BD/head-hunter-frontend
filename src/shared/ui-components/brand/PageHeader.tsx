import type { ReactNode } from "react";
import { cn } from "@/shared/libs/shadCnConfig";

/** A label/value readout shown on the right of the header (e.g. FOLLOWING 3). */
export interface HeaderMetric {
  readonly label: string;
  readonly value: ReactNode;
}

interface PageHeaderProps {
  /** Small caption above the title — the reference's crumb line. */
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Sits beside the title — the reference's inline count chip or status pill. */
  badge?: ReactNode;
  /**
   * Right-side metric readouts, rendered as the reference's `.fact` pairs: an
   * 11px uppercase label over a tabular figure.
   */
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
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 sm:ml-auto sm:shrink-0">
            {metrics?.map((metric) => (
              <div key={metric.label} className="min-w-0">
                <p className="text-label font-[650] uppercase text-ink-muted">
                  {metric.label}
                </p>
                <p className="mt-[3px] text-block font-[550] tabular-nums text-ink">
                  {metric.value}
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
