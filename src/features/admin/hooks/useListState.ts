"use client";

import { useEffect, useState } from "react";

import { DEFAULT_PAGE_SIZE } from "../api/admin";

/**
 * Local state for a searchable, filterable, paginated admin list. The search
 * box is debounced, and any filter or page-size change resets to page 1.
 */
export function useListState(initialStatus = "") {
  const [page, setPage] = useState(1);
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [limit, setLimit] = useState<number>(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(qInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [qInput]);

  const changeStatus = (next: string): void => {
    setStatus(next);
    setPage(1);
  };

  const changeLimit = (next: number): void => {
    setLimit(next);
    setPage(1);
  };

  return {
    page,
    setPage,
    qInput,
    setQInput,
    q,
    status,
    changeStatus,
    limit,
    changeLimit,
  };
}
