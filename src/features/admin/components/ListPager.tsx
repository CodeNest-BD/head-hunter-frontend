"use client";

import { TablePager } from "@/shared/ui-components/data/TablePager";
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

/**
 * Admin footer pager — a thin adapter over the shared TablePager so every
 * admin table shares the exact numbered-pager pattern used site-wide.
 */
export function ListPager({
  page,
  totalPages,
  total,
  onPage,
  pageSize,
  onPageSize,
}: ListPagerProps) {
  return (
    <TablePager
      page={page}
      totalPages={totalPages}
      total={total}
      onPage={onPage}
      pageSize={pageSize ?? PAGE_SIZE_OPTIONS[0]}
      onPageSize={onPageSize}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
    />
  );
}
