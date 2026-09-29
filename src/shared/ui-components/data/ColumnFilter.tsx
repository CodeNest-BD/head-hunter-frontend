"use client";

import { useState, type ReactNode } from "react";
import { Check, ListFilter, Search } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui-components/controls/popover";

import { TABLE_TH } from "./tableStyles";
import { MENU_OPTION_LIST } from "@/shared/ui-components/controls/menuStyles";

export interface ColumnFilterOption {
  value: string;
  label: string;
}

/** Past this many options the popover grows its own search box. */
const SEARCHABLE_THRESHOLD = 8;

interface CommonProps {
  /** The column's name — drives the accessible label, not the visible text. */
  label: string;
  options: readonly ColumnFilterOption[];
  /**
   * Force the search box on or off. Left unset, it appears once the list is
   * long enough to be worth searching.
   */
  searchable?: boolean;
}

/**
 * Single- and multi-select are one discriminated union rather than two
 * components, so a column cannot be handed a `Set` and a single-value
 * `onChange` that quietly ignores all but the last pick.
 */
type SelectionProps =
  | {
      multiple?: false;
      /** `null` means no filter is applied. */
      value: string | null;
      onChange: (next: string | null) => void;
    }
  | {
      multiple: true;
      /** An empty set means no filter is applied. */
      value: ReadonlySet<string>;
      onChange: (next: Set<string>) => void;
    };

export type ColumnFilterProps = CommonProps & SelectionProps;

/**
 * The filter control every data table shares: a `ListFilter` icon in the column
 * header opening a value list, tinted once a value is picked, with a Clear row
 * at the foot. Single-select by default; `multiple` turns the rows into
 * checkboxes and the Clear row into "Clear (n)".
 *
 * Deliberately presentational — the selection is handed straight back, so the
 * table that owns the query decides what to do with it.
 */
export function ColumnFilter(props: ColumnFilterProps) {
  const { label, options, searchable } = props;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected: ReadonlySet<string> = props.multiple
    ? props.value
    : new Set(props.value === null ? [] : [props.value]);
  const active = selected.size > 0;

  const withSearch = searchable ?? options.length > SEARCHABLE_THRESHOLD;
  const shown = withSearch
    ? options.filter((option) =>
        option.label.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : options;

  const pick = (value: string): void => {
    if (props.multiple) {
      const next = new Set(props.value);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      props.onChange(next);
      return;
    }
    // Single-select closes on choice; multi-select stays open so several
    // values can be picked without reopening the popover each time.
    props.onChange(value);
    setOpen(false);
    setSearch("");
  };

  const clear = (): void => {
    if (props.multiple) props.onChange(new Set());
    else props.onChange(null);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={
            active ? `Filter by ${label} (filtered)` : `Filter by ${label}`
          }
          className={cn(
            "inline-flex size-5 items-center justify-center rounded-xs transition-colors",
            active
              ? "bg-tint text-blue"
              : "text-ink-faint hover:bg-surface-sunken hover:text-ink",
          )}
        >
          <ListFilter className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-0">
        {withSearch && (
          <div className="border-b border-line p-2">
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint"
              />
              <input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search ${label.toLowerCase()}…`}
                aria-label={`Search ${label}`}
                className="h-7.5 w-full rounded-sm border border-line-strong bg-surface pl-7 pr-2 text-meta text-ink outline-none transition-colors placeholder:text-ink-faint focus-visible:border-blue focus-visible:shadow-focus"
              />
            </div>
          </div>
        )}
        <div className={cn("max-h-56 overflow-y-auto p-1", MENU_OPTION_LIST)}>
          {shown.length === 0 ? (
            <p className="px-2 py-3 text-center text-meta text-ink-muted">
              No matches
            </p>
          ) : (
            shown.map((option) => {
              const checked = selected.has(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  role={props.multiple ? "checkbox" : undefined}
                  aria-checked={props.multiple ? checked : undefined}
                  onClick={() => pick(option.value)}
                  className="flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-left text-meta text-ink-body transition-colors hover:bg-surface-sub"
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center",
                      props.multiple &&
                        cn(
                          "rounded-[4px] border",
                          checked
                            ? "border-blue bg-blue text-white"
                            : "border-line-strong",
                        ),
                    )}
                  >
                    {checked &&
                      (props.multiple ? (
                        <Check className="size-3" strokeWidth={3} />
                      ) : (
                        <Check className="size-3.5 text-blue" />
                      ))}
                  </span>
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })
          )}
        </div>
        {active && (
          <div className="border-t border-line p-1">
            <button
              type="button"
              onClick={clear}
              className="w-full rounded-xs px-2 py-1.5 text-left text-meta font-[550] text-blue-ink transition-colors hover:bg-surface-sub"
            >
              {props.multiple ? `Clear (${selected.size})` : "Clear"}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/**
 * A header cell that carries its column's filter beside the label, so every
 * table puts the control in the same place relative to the heading.
 */
export function FilterableHead({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <th scope="col" className={cn(TABLE_TH, className)}>
      <span className="inline-flex items-center gap-1.5">
        {label}
        {children}
      </span>
    </th>
  );
}
