"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui-components/controls/select";

const DEFAULT_PAGE_SIZES = [10, 25, 50, 100] as const;

interface TablePagerProps {
  page: number;
  totalPages: number;
  total: number;
  onPage: (page: number) => void;
  /** Rows currently on the page — drives the "1–10 of N" range readout. */
  pageSize: number;
  /** When provided, renders the rows-per-page selector. */
  onPageSize?: (size: number) => void;
  pageSizeOptions?: readonly number[];
}

/**
 * Build the page-button list with ellipses, e.g. [1,2,3,4,"…",51]. Always
 * keeps the first and last page, plus a window around the current page.
 */
function pageWindow(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const out: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) out.push("…");
  for (let p = start; p <= end; p += 1) out.push(p);
  if (end < totalPages - 1) out.push("…");
  out.push(totalPages);
  return out;
}

/**
 * Footer pager matching the reference: a rows-per-page selector and a
 * "1–10 of N" range on the left, numbered page buttons with prev/next
 * chevrons on the right. Shared by every table so pagination is identical
 * site-wide.
 */
export function TablePager({
  page,
  totalPages,
  total,
  onPage,
  pageSize,
  onPageSize,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
}: TablePagerProps) {
  const safeTotalPages = Math.max(totalPages, 1);
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t border-border bg-card px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        {onPageSize && (
          <Select
            value={String(pageSize)}
            onValueChange={(next) => onPageSize(Number(next))}
          >
            <SelectTrigger className="h-8 w-[72px]" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <span className="tabular-nums text-brand-gray">
          {first.toLocaleString()}–{last.toLocaleString()} of{" "}
          {total.toLocaleString()}
        </span>
      </div>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        <PagerButton
          ariaLabel="Previous page"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </PagerButton>

        {pageWindow(page, safeTotalPages).map((entry, index) =>
          entry === "…" ? (
            <span
              key={`gap-${index}`}
              className="px-1.5 text-brand-gray-light"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <PagerButton
              key={entry}
              ariaLabel={`Page ${entry}`}
              active={entry === page}
              onClick={() => onPage(entry)}
            >
              {entry}
            </PagerButton>
          ),
        )}

        <PagerButton
          ariaLabel="Next page"
          disabled={page >= safeTotalPages}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </PagerButton>
      </nav>
    </div>
  );
}

function PagerButton({
  children,
  onClick,
  disabled = false,
  active = false,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm font-semibold tabular-nums transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-card text-navy hover:border-brand-primary hover:text-primary",
        "disabled:pointer-events-none disabled:opacity-40",
      )}
    >
      {children}
    </button>
  );
}
