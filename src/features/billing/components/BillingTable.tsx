"use client";

import { Button } from "@/shared/ui-components/controls/button";

interface BillingTableFooterProps {
  total: number;
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}

/**
 * The "N total · page X of Y" + Previous/Next footer under a billing table —
 * the reference's `.pager`: a hairline-ruled 12.5px strip whose tabular count
 * sits at the left and whose page controls are pushed to the right edge.
 */
export function BillingTableFooter({
  total,
  page,
  totalPages,
  onPage,
}: BillingTableFooterProps) {
  return (
    <div className="flex flex-col gap-2 border-t border-line px-3.5 py-2.5 text-[12.5px] text-ink-muted sm:flex-row sm:items-center">
      <span className="tabular-nums">
        {total.toLocaleString()} total · page {page} of{" "}
        {Math.max(totalPages, 1)}
      </span>
      <div className="flex items-center gap-1 sm:ml-auto">
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
