import type { ReactNode } from "react";
import { cn } from "@/shared/libs/shadCnConfig";

interface PageHeaderProps {
  title: ReactNode;
  /** Right-aligned actions (e.g. a primary button). */
  actions?: ReactNode;
  className?: string;
}

/**
 * Page-level heading + optional actions row. The breadcrumb in the top bar is
 * the visible page name, so this renders no visible title or subtitle — it
 * keeps a screen-reader-only h1 for the document outline and, when a page needs
 * them, a right-aligned actions row.
 */
export function PageHeader({ title, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("[animation:fadeUp_.4s_ease_both]", className)}>
      {/* Kept for the document outline / screen readers; the breadcrumb is the
       * visible page name. */}
      <h1 className="sr-only">{title}</h1>
      {actions && (
        <div className="flex flex-wrap items-center justify-end gap-3">
          {actions}
        </div>
      )}
    </header>
  );
}
