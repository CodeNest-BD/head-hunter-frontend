"use client";

import { useEffect, useState } from "react";

/**
 * Local state for a searchable, filterable, paginated admin list. The search
 * box is debounced and any filter change resets to page 1.
 */
export function useListState() {
  const [page, setPage] = useState(1);
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

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

  return { page, setPage, qInput, setQInput, q, status, changeStatus };
}
