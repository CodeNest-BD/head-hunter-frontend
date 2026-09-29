"use client";

import { useEffect, useRef, useState } from "react";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Check, SlidersHorizontal } from "lucide-react";
import { MENU_OPTION_LIST } from "@/shared/ui-components/controls/menuStyles";

export interface ColumnDef {
  key: string;
  label: string;
  /** Required columns can't be hidden (e.g. the name column). */
  required?: boolean;
}

/**
 * Per-table column visibility, persisted in localStorage so a user's choice
 * survives navigation. Returns a Set of visible keys plus a toggle.
 *
 * `onHide` fires when the reader switches a column **off** — and only then.
 * Filters live in their column header, so a hidden column takes its control off
 * screen while the filter goes on narrowing the list; tables use this to clear
 * that filter. It is deliberately driven by the toggle rather than by watching
 * visibility: a column that is *already* hidden when the page loads must not
 * clear a filter that arrived with the URL, which is how `?status=` deep links
 * reach this table.
 */
export function useVisibleColumns(
  storageKey: string,
  columns: ColumnDef[],
  onHide?: (key: string) => void,
) {
  const allKeys = columns.map((c) => c.key);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  // Held in a ref so a caller can pass an inline arrow without re-binding.
  const onHideRef = useRef(onHide);
  onHideRef.current = onHide;

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
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
      onHideRef.current?.(key);
    }
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
          className="hidden h-7.5 items-center gap-[7px] rounded-xs px-2.5 text-[12.5px] font-semibold text-ink-muted transition-colors hover:bg-surface-sub hover:text-ink sm:inline-flex"
        >
          <SlidersHorizontal className="size-[15px]" />
          Columns
        </button>
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align="end"
          sideOffset={4}
          className={`z-50 min-w-[200px] rounded-sm border border-line bg-surface p-1 shadow-pop ${MENU_OPTION_LIST}`}
        >
          <p className="px-2.5 py-1.5 text-label font-[650] uppercase text-ink-muted">
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
                className="flex cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-1.5 text-sub text-ink-body outline-none hover:bg-surface-sub focus:bg-surface-sub data-[disabled]:cursor-default data-[disabled]:opacity-60"
              >
                <span
                  className={`flex size-[15px] items-center justify-center rounded-[4px] border ${
                    checked
                      ? "border-blue bg-blue text-white"
                      : "border-line-strong"
                  }`}
                >
                  {checked && <Check className="size-3" strokeWidth={3} />}
                </span>
                {column.label}
                {column.required && (
                  <span className="ml-auto text-meta text-ink-faint">
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
