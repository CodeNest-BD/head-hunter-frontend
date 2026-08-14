import type { ReactNode } from "react";
import { cn } from "@/shared/libs/shadCnConfig";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-aligned actions (e.g. a primary button). */
  actions?: ReactNode;
  /** Extra content under the header (e.g. filters). */
  children?: ReactNode;
  className?: string;
}

/**
 * Standard page header in the Head-Hunters Platform style: a muted subtitle and
 * a clean hairline, with the mock's subtle fade-up entrance. The breadcrumb in
 * the top bar names the page, so the title is kept only as a screen-reader
 * heading (a visible headline would duplicate the breadcrumb).
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  children,
  className,
}: PageHeaderProps) {
  return (
    // No own bottom margin: every page places this inside a flex column whose
    // `gap` owns the spacing — a margin here would stack on top of it.
    <header className={cn("[animation:fadeUp_.4s_ease_both]", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {/* Kept for the document outline / screen readers; the breadcrumb is
           * the visible page name. */}
          <h1 className="sr-only">{title}</h1>
          {subtitle && (
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-3">{actions}</div>
        )}
      </div>
      <div className="mt-5 h-px w-full bg-border" />
      {children}
    </header>
  );
}
