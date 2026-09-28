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
 * The reference's `.pager`: a 10px/14px footer above a hairline carrying the
 * rows-per-page selector and a "1–10 of N" range on the left, with 28px
 * numbered page buttons and prev/next chevrons pushed to the right. Shared by
 * every table so pagination is identical site-wide.
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
    <div className="flex flex-col gap-2 border-t border-line px-3.5 py-2.5 text-[12.5px] text-ink-muted sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        {onPageSize && (
          <Select
            value={String(pageSize)}
            onValueChange={(next) => onPageSize(Number(next))}
          >
            <SelectTrigger className="h-7 w-[68px]" aria-label="Rows per page">
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
        <span className="tabular-nums">
          {first.toLocaleString()}–{last.toLocaleString()} of{" "}
          {total.toLocaleString()}
        </span>
      </div>

      <nav
        className="flex flex-wrap items-center gap-1 sm:ml-auto"
        aria-label="Pagination"
      >
        <PagerButton
          ariaLabel="Previous page"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft className="size-3.5" />
        </PagerButton>

        {pageWindow(page, safeTotalPages).map((entry, index) =>
          entry === "…" ? (
            <span
              key={`gap-${index}`}
              className="px-1 text-ink-faint"
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
          <ChevronRight className="size-3.5" />
        </PagerButton>
      </nav>
    </div>
  );
}

/** `.pager__btn` — a 28px hairline button that fills cobalt when it is the
 * current page. */
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
        "inline-flex h-7 min-w-7 items-center justify-center rounded-xs border px-2 text-[12.5px] font-[550] tabular-nums transition-colors",
        active
          ? "border-blue bg-blue text-white"
          : "border-line-strong bg-surface text-ink-body hover:bg-surface-sub",
        "disabled:pointer-events-none disabled:opacity-45",
      )}
    >
      {children}
    </button>
  );
}
