"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui-components/controls/select";

export const DEFAULT_PAGE_SIZE_OPTIONS = [25, 50, 100, 1000] as const;

interface DataTablePaginationProps {
  /** 1-based current page. */
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
  pageSizeOptions?: readonly number[];
}

/**
 * Windowed, numbered pager: first/last always shown, the current page ±1, and
 * ellipses for the gaps. Pairs with a rows-per-page selector and a running
 * total. Shared by every server-paginated table.
 */
function pageItems(
  page: number,
  pageCount: number,
): Array<number | "ellipsis"> {
  const pages = new Set<number>([1, pageCount]);
  for (let p = page - 1; p <= page + 1; p += 1) {
    if (p >= 1 && p <= pageCount) pages.add(p);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const items: Array<number | "ellipsis"> = [];
  let previous = 0;
  for (const p of sorted) {
    if (p - previous > 1) items.push("ellipsis");
    items.push(p);
    previous = p;
  }
  return items;
}

export function DataTablePagination({
  page,
  pageCount,
  total,
  pageSize,
  onPage,
  onPageSize,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: DataTablePaginationProps) {
  const safePageCount = Math.max(pageCount, 1);
  const items = pageItems(page, safePageCount);

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <span className="text-muted-foreground">
          {total.toLocaleString()} total
        </span>
        <label className="flex items-center gap-2 text-muted-foreground">
          <span className="hidden sm:inline">Rows</span>
          <Select
            value={String(pageSize)}
            onValueChange={(next) => onPageSize(Number(next))}
          >
            <SelectTrigger className="h-8 w-[84px]" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size.toLocaleString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {items.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-1.5 text-muted-foreground"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <Button
              key={item}
              type="button"
              variant={item === page ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-8 min-w-8 px-2",
                item === page && "font-semibold",
              )}
              aria-label={`Page ${item}`}
              aria-current={item === page ? "page" : undefined}
              onClick={() => onPage(item)}
            >
              {item}
            </Button>
          ),
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label="Next page"
          disabled={page >= safePageCount}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </nav>
    </div>
  );
}
