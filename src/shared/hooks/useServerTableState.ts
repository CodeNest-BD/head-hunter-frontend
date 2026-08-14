"use client";

import { useEffect, useState } from "react";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";

export const PAGE_SIZE_OPTIONS = [25, 50, 100, 1000] as const;
export const DEFAULT_PAGE_SIZE = 25;

interface UseServerTableStateOptions {
  /** Initial sort, e.g. `[{ id: "joinedAt", desc: true }]`. */
  defaultSort: SortingState;
  /** Optional pre-applied status filter (deep-links). */
  initialStatus?: string;
}

/**
 * State for a server-driven table: page, page size, debounced search, a status
 * filter, and single-column sorting — with every filter/sort/size change
 * resetting to page 1. Returns `sortBy`/`sortOrder` already derived for the API.
 * Reusable by any list backed by a paginated + sortable endpoint.
 */
export function useServerTableState({
  defaultSort,
  initialStatus = "",
}: UseServerTableStateOptions) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState<number>(DEFAULT_PAGE_SIZE);
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatusState] = useState(initialStatus);
  const [sorting, setSortingState] = useState<SortingState>(defaultSort);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(qInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [qInput]);

  const setStatus = (next: string): void => {
    setStatusState(next);
    setPage(1);
  };

  const setPageSize = (next: number): void => {
    setPageSizeState(next);
    setPage(1);
  };

  const setSorting: OnChangeFn<SortingState> = (updater) => {
    setSortingState((prev) =>
      typeof updater === "function" ? updater(prev) : updater,
    );
    setPage(1);
  };

  const sort = sorting[0];

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    qInput,
    setQInput,
    q,
    status,
    setStatus,
    sorting,
    setSorting,
    sortBy: sort?.id,
    sortOrder: (sort?.desc ?? true) ? ("DESC" as const) : ("ASC" as const),
  };
}
