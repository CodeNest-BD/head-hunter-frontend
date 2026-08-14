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
  // `initialStatus` seeds the filter once, at mount. Callers that deep-link a
  // status (e.g. JobsTable via ?status=) reach a fresh mount on navigation, so
  // this is correct; it is not meant to re-sync if the prop changes in place.
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
