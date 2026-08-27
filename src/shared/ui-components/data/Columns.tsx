"use client";

import { useEffect, useState } from "react";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Check, SlidersHorizontal } from "lucide-react";

export interface ColumnDef {
  key: string;
  label: string;
  /** Required columns can't be hidden (e.g. the name column). */
  required?: boolean;
}

/**
 * Per-table column visibility, persisted in localStorage so a user's choice
 * survives navigation. Returns a Set of visible keys plus a toggle.
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

/** The "Columns" dropdown (checkbox list) matching the reference's toggle. */
export function ColumnsToggle({
  columns,
  isVisible,
  onToggle,
}: {
  columns: ColumnDef[];
  isVisible: (key: string) => boolean;
  onToggle: (key: string) => void;
}) {
  return (
    <Dropdown.Root>
      {/* The trigger is hidden below sm: phones get the stacked card list, whose
          field set is fixed, so column visibility would control nothing there. */}
      <Dropdown.Trigger asChild>
        <button
          type="button"
          className="hidden h-9 items-center gap-2 rounded-md border border-input bg-card px-3 text-sm font-semibold text-navy transition-colors hover:border-brand-primary hover:text-primary sm:inline-flex"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Columns
        </button>
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align="end"
          sideOffset={4}
          className="z-50 min-w-[200px] rounded-md border border-border bg-popover p-1.5 shadow-card-lg"
        >
          <p className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-gray">
            Toggle columns
          </p>
          {columns.map((column) => {
            const checked = isVisible(column.key);
            return (
              <Dropdown.CheckboxItem
                key={column.key}
                checked={checked}
                disabled={column.required}
                onSelect={(event) => {
                  event.preventDefault();
                  onToggle(column.key);
                }}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-foreground outline-none hover:bg-accent focus:bg-accent data-[disabled]:cursor-default data-[disabled]:opacity-60"
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded border ${
                    checked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input"
                  }`}
                >
                  {checked && <Check className="h-3 w-3" />}
                </span>
                {column.label}
                {column.required && (
                  <span className="ml-auto text-xs text-brand-gray-light">
                    required
                  </span>
                )}
              </Dropdown.CheckboxItem>
            );
          })}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
