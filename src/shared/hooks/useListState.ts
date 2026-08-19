"use client";

import { useEffect, useState } from "react";

interface UseListStateOptions {
  initialStatus?: string;
  initialLimit?: number;
}

/**
 * Local state for a searchable, filterable, paginated table: a debounced search
 * box, a status filter, page-size, and the current page. Any filter, search, or
 * page-size change resets to page 1. Shared by every table across the platform
 * so search/filter/pagination behave identically for admin, recruiter and
 * company accounts.
 */
export function useListState({
  initialStatus = "",
  initialLimit = 25,
}: UseListStateOptions = {}) {
  const [page, setPage] = useState(1);
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [limit, setLimit] = useState<number>(initialLimit);

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
