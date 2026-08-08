import type { ReactNode } from "react";
import { cn } from "@/shared/libs/shadCnConfig";
import { Eyebrow } from "./Eyebrow";

interface PageHeaderProps {
  /** Optional uppercase eyebrow label. */
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-aligned actions (e.g. a primary button). */
  actions?: ReactNode;
  /** Extra content under the header (e.g. filters). */
  children?: ReactNode;
  className?: string;
}

/**
 * Standard page header in the Head-Hunters Platform style: a small eyebrow, a
 * heavy navy headline, a muted subtitle, and a clean hairline — with the mock's
 * subtle fade-up entrance.
 */
export function PageHeader({
  eyebrow,
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
          {eyebrow && (
            <div className="mb-2">
              <Eyebrow>{eyebrow}</Eyebrow>
            </div>
          )}
          <h1 className="font-heading text-2xl font-extrabold tracking-[-0.01em] text-navy sm:text-[30px]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
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
