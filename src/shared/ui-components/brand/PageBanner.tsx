import type { ReactNode } from "react";
import { cn } from "@/shared/libs/shadCnConfig";

/** A label/value readout shown on the right of the banner (e.g. FOLLOWING 3). */
export interface BannerMetric {
  readonly label: string;
  readonly value: ReactNode;
}

interface PageBannerProps {
  /** Small uppercase caption above the title (e.g. OVERVIEW). */
  eyebrow?: ReactNode;
  /** Headline. A blue "." accent is appended automatically. */
  title: ReactNode;
  /**
   * Whether to append the brand's blue "." accent after the title. On for the
   * standard "Hey Ben." greeting; off when the title is a possessive phrase
   * ("Ben's Dashboard") where a trailing period reads as a typo.
   */
  accentPeriod?: boolean;
  subtitle?: ReactNode;
  /**
   * Right-side metric readouts. Rendered as a horizontal row of
   * uppercase-label / large-value pairs — the metrics a page leads with.
   */
  metrics?: readonly BannerMetric[];
  /** Right-side actions (buttons) or a status indicator. Sits after metrics. */
  actions?: ReactNode;
  /**
   * "default" for section pages (Companies, Wallet, …); "lg" for the dashboard
   * greeting, where the headline carries more weight.
   */
  size?: "default" | "lg";
  className?: string;
}

/**
 * The light banner that opens every dashboard/section page: an optional eyebrow,
 * a heavy blue headline with the brand's "." accent, a muted subtitle, and a
 * right slot holding either metric readouts or a primary action. One deep module
 * so no page reimplements the header chrome. (Formerly a dark navy card; the
 * whole app moved to the lighter scheme.)
 */
export function PageBanner({
  eyebrow,
  title,
  accentPeriod = true,
  subtitle,
  metrics,
  actions,
  size = "default",
  className,
}: PageBannerProps) {
  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-md border border-brand-line bg-card px-6 py-5 shadow-card [animation:fadeUp_.4s_ease_both] sm:px-8 sm:py-6",
        className,
      )}
    >
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/70">
              {eyebrow}
            </span>
          )}
          <h1
            className={cn(
              "font-heading font-extrabold tracking-[-0.02em] text-primary",
              eyebrow && "mt-2",
              size === "lg"
                ? "text-3xl sm:text-4xl"
                : "text-2xl sm:text-[28px]",
            )}
          >
            {title}
            {accentPeriod && <span className="text-navy">.</span>}
          </h1>
          {subtitle && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        {(metrics?.length || actions) && (
          <div className="flex shrink-0 items-center gap-6 sm:gap-8">
            {metrics?.map((metric) => (
              <div key={metric.label} className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/70">
                  {metric.label}
                </p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums text-navy">
                  {metric.value}
                </p>
              </div>
            ))}
            {actions && (
              <div className="flex items-center gap-3">{actions}</div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
