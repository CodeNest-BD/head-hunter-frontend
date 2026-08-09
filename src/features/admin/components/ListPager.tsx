"use client";

import { Button } from "@/shared/ui-components/controls/button";

interface ListPagerProps {
  page: number;
  totalPages: number;
  total: number;
  onPage: (page: number) => void;
}

/** Footer pager shared by the admin tables; hidden when there's one page. */
export function ListPager({ page, totalPages, total, onPage }: ListPagerProps) {
  return (
    <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
      <span className="text-muted-foreground">
        {total.toLocaleString()} total · page {page} of{" "}
        {Math.max(totalPages, 1)}
      </span>
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
