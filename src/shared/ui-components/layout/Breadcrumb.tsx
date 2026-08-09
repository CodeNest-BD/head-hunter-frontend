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
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
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
                  className="font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-none"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    isLast
                      ? "font-semibold text-navy"
                      : "text-muted-foreground",
                  )}
                >
                  {crumb.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50"
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
