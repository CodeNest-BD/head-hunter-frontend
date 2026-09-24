"use client";

import { Button } from "@/shared/ui-components/controls/button";

/**
 * The billing card-table look, shared by the placements, escrow, and
 * withdrawals tables so they stay identical side by side on the wallet pages.
 */
export const TH = "px-5 py-3 font-semibold";
export const HEAD_ROW =
  "border-b border-border bg-muted/40 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground";
export const BODY_ROW =
  "border-b border-border/60 transition-colors last:border-0 even:bg-muted/20 hover:bg-accent/50";

interface BillingTableFooterProps {
  total: number;
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}

/** The "N total · page X of Y" + Previous/Next footer under a billing table. */
export function BillingTableFooter({
  total,
  page,
  totalPages,
  onPage,
}: BillingTableFooterProps) {
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
