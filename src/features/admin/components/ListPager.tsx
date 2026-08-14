"use client";

import { Button } from "@/shared/ui-components/controls/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui-components/controls/select";
import { PAGE_SIZE_OPTIONS } from "../api/admin";

interface ListPagerProps {
  page: number;
  totalPages: number;
  total: number;
  onPage: (page: number) => void;
  /** Current rows-per-page; when provided, renders the page-size selector. */
  pageSize?: number;
  onPageSize?: (size: number) => void;
}

/** Footer pager shared by the admin tables, with a rows-per-page selector. */
export function ListPager({
  page,
  totalPages,
  total,
  onPage,
  pageSize,
  onPageSize,
}: ListPagerProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-border px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <span className="text-muted-foreground">
          {total.toLocaleString()} total · page {page} of{" "}
          {Math.max(totalPages, 1)}
        </span>
        {pageSize !== undefined && onPageSize && (
          <label className="flex items-center gap-2 text-muted-foreground">
            <span className="hidden sm:inline">Rows</span>
            <Select
              value={String(pageSize)}
              onValueChange={(next) => onPageSize(Number(next))}
            >
              <SelectTrigger
                className="h-8 w-[84px]"
                aria-label="Rows per page"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
