"use client";

import { TablePager } from "@/shared/ui-components/data/TablePager";

interface BillingTableFooterProps {
  total: number;
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
  className?: string;
}

/**
 * Every billing list is fetched twenty a page, and none offers a page-size
 * choice, so the size is fixed here rather than threaded through four callers.
 */
const BILLING_PAGE_SIZE = 20;

/**
 * The footer under a billing table. Delegates to the app's one `TablePager`, so
 * a wallet page pages exactly like every other table, rather than offering bare
 * Previous/Next where the rest of the app offers numbered pages.
 */
export function BillingTableFooter({
  total,
  page,
  totalPages,
  onPage,
  className,
}: BillingTableFooterProps) {
  return (
    <TablePager
      page={page}
      totalPages={totalPages}
      total={total}
      onPage={onPage}
      pageSize={BILLING_PAGE_SIZE}
      className={className}
    />
  );
}
