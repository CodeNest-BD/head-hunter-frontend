import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Standard breadcrumb trail. Every item except the last is a link; the last is
 * the current page (`aria-current="page"`) and never a link.
 */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="[animation:fadeUp_.4s_ease_both]">
      <ol className="flex flex-wrap items-center gap-1.5 text-meta text-ink-faint">
        {items.map((crumb, index) => {
          const isLast = index === items.length - 1;
          return (
            <li
              key={`${crumb.label}-${index}`}
              className="flex items-center gap-1.5"
            >
              {crumb.href && !isLast ? (
                <Link
                  href={crumb.href}
                  className="text-ink-muted transition-colors hover:text-blue-ink focus-visible:text-blue-ink focus-visible:outline-none"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    isLast ? "font-[550] text-ink" : "text-ink-muted",
                  )}
                >
                  {crumb.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight
                  className="size-3 shrink-0 text-ink-faint"
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
