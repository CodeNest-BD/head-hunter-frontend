"use client";

import { useEffect, useState } from "react";

export interface ColumnDef {
  key: string;
  label: string;
  /** Required columns can't be hidden (e.g. the name column). */
  required?: boolean;
}

/**
 * Per-table column visibility, persisted in localStorage so a reader's choice
 * survives navigation. Returns a `Set` of visible keys plus a toggle.
 *
 * Visibility is purely about what the table SHOWS. Filtering lives in the
 * filter bar above the table, which is always on screen — so hiding a column
 * can no longer take a control away with it, and this hook has nothing to
 * clean up when it does.
 *
 * The picker that drives it is `TableFilterBar`'s Columns popover; pass the
 * same `columns`, `isVisible` and `toggle` straight through.
 */
export function useVisibleColumns(storageKey: string, columns: ColumnDef[]) {
  const allKeys = columns.map((c) => c.key);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  // Read once on mount (client only) so SSR markup stays deterministic.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setHidden(new Set(JSON.parse(raw) as string[]));
    } catch {
      // Ignore malformed storage — fall back to all-visible.
    }
  }, [storageKey]);

  const persist = (next: Set<string>): void => {
    setHidden(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify([...next]));
    } catch {
      // Non-fatal: visibility just won't persist.
    }
  };

  const toggle = (key: string): void => {
    const column = columns.find((c) => c.key === key);
    if (column?.required) return;
    const next = new Set(hidden);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    persist(next);
  };

  const isVisible = (key: string): boolean => !hidden.has(key);

  return { columns, isVisible, toggle, allKeys };
}
