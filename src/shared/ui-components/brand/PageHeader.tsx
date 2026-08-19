import type { ReactNode } from "react";
import { cn } from "@/shared/libs/shadCnConfig";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-aligned actions (e.g. a primary button). */
  actions?: ReactNode;
  /** Extra content under the header (e.g. filters). */
  children?: ReactNode;
  /**
   * "plain" (default): navy headline on the page canvas with a hairline.
   * "banner": a dark navy (#0A1738) banner card — used by the admin
   * management screens.
   */
  variant?: "plain" | "banner";
  className?: string;
}

/**
 * Standard page header in the Head-Hunters Platform style: a heavy navy
 * headline, a muted subtitle, and a clean hairline — with the mock's subtle
 * fade-up entrance. The breadcrumb in the top bar names the section, so the
 * header carries no eyebrow. The `banner` variant renders a dark navy card
 * for the admin management screens.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  children,
  variant = "plain",
  className,
}: PageHeaderProps) {
  if (variant === "banner") {
    return (
      <header
        className={cn(
          "rounded-md bg-navy px-6 py-5 shadow-card [animation:fadeUp_.4s_ease_both] sm:px-7",
          className,
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-heading text-xl font-extrabold tracking-[-0.01em] text-white sm:text-[22px]">
              {title}
              <span className="text-primary">.</span>
            </h1>
            {subtitle && (
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/60">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-3">{actions}</div>
          )}
        </div>
        {children}
      </header>
    );
  }

  return (
    // No own bottom margin: every page places this inside a flex column whose
    // `gap` owns the spacing — a margin here would stack on top of it.
    <header className={cn("[animation:fadeUp_.4s_ease_both]", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-xl font-extrabold tracking-[-0.01em] text-navy sm:text-[22px]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-3">{actions}</div>
        )}
      </div>
      <div className="mt-4 h-px w-full bg-border" />
      {children}
    </header>
  );
}
