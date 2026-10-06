"use client";

import { useState, type ReactNode } from "react";
import {
  Check,
  Download,
  ListFilter,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import { MENU_OPTION_LIST } from "@/shared/ui-components/controls/menuStyles";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui-components/controls/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui-components/controls/select";

import type { ColumnDef } from "./Columns";

export interface FilterBarOption {
  value: string;
  label: string;
}

/**
 * One control in the bar.
 *
 * A discriminated union on `kind` rather than one `value: string | Set<string>`
 * bag: a multi-select handed a single-value `onChange` would quietly keep only
 * the last pick, and the union makes that combination unrepresentable. Each
 * variant carries its own `value`/`onChange` pair, so a screen's own typed
 * state flows straight in and out without a cast.
 */
export type TableFilter =
  | {
      kind: "search";
      key: string;
      /** Drives the accessible name; the bar shows the placeholder instead. */
      label: string;
      placeholder?: string;
      value: string;
      onChange: (next: string) => void;
    }
  | {
      kind: "select";
      key: string;
      label: string;
      /** Shown while nothing is chosen. Defaults to the label. */
      placeholder?: string;
      options: readonly FilterBarOption[];
      /** `""` means unfiltered — the shape the screens' query state uses. */
      value: string;
      onChange: (next: string) => void;
      /** CSS width for the trigger. Defaults to 160px, as in fh-core. */
      width?: string;
      /**
       * Force the option search on or off. Left unset it appears once the list
       * is long enough to be worth searching, and the control switches from a
       * plain dropdown to a searchable one — a decision the bar makes, not the
       * screen, so a caller never has to pick a widget.
       */
      searchable?: boolean;
    }
  | {
      kind: "multiselect";
      key: string;
      label: string;
      options: readonly FilterBarOption[];
      /** An empty set means unfiltered. */
      value: ReadonlySet<string>;
      onChange: (next: Set<string>) => void;
      width?: string;
      /** Force the option search on or off; otherwise it appears once the
       * list is long enough to be worth searching. */
      searchable?: boolean;
    }
  | {
      kind: "custom";
      key: string;
      /** Whether this control is currently narrowing the list — the bar cannot
       * see inside a custom control, and a Clear that ignored it would offer
       * to clear half of what is applied. */
      active?: boolean;
      render: () => ReactNode;
    };

interface TableFilterBarProps {
  filters?: readonly TableFilter[];
  /** Omit the columns and no Columns button appears. */
  columns?: readonly ColumnDef[];
  isColumnVisible?: (key: string) => boolean;
  onToggleColumn?: (key: string) => void;
  onExport?: () => void;
  exportLabel?: string;
  /**
   * Put every filter back to its default. Omit it and no Clear appears.
   *
   * The screen owns the reset rather than this bar, because this bar does not
   * know what a filter COSTS: clearing one almost always means going back to
   * page 1 too, and on some screens a filter seeds a sibling query. Only the
   * screen can put all of that back.
   */
  onClearFilters?: () => void;
  /** Extra controls rendered after the filters and before Clear. */
  children?: ReactNode;
  /**
   * Where the bar is standing.
   *
   * `canvas` (the default) is the list screen: the bar is its own bordered
   * strip above the table card. `card` is a panel that already has a border and
   * a title of its own — there the bar is ruled off under the card's head
   * instead of drawing a second frame inside the first.
   */
  surface?: "canvas" | "card";
  className?: string;
}

/** Past this many options a filter grows its own search box. */
const SEARCHABLE_THRESHOLD = 8;

/** Shared so an unfiltered dropdown does not allocate a Set on every render. */
const EMPTY_SELECTION: ReadonlySet<string> = new Set();

/**
 * The stand-in Radix needs for an option that means "everything".
 *
 * Radix reserves the empty string: `value=""` on a Select means NO VALUE, so it
 * shows the placeholder instead of the chosen option. Every screen here spells
 * "no filter" as `''`, and each one would render a blank control once "All …"
 * was picked — which reads as a filter that failed to apply rather than one
 * deliberately set to everything.
 *
 * Translating at the boundary keeps the sentinel entirely inside this file: the
 * screens above still hand us `''` and still receive `''` back.
 */
const ALL_VALUE = "__all__";

/** Is this filter narrowing the list? */
function isActive(filter: TableFilter): boolean {
  switch (filter.kind) {
    case "search":
      return filter.value !== "";
    case "select":
      return filter.value !== "";
    case "multiselect":
      return filter.value.size > 0;
    case "custom":
      return filter.active === true;
  }
}

function SearchFilter({
  filter,
}: {
  filter: Extract<TableFilter, { kind: "search" }>;
}) {
  return (
    // Grows with the available space but never collapses below a usable
    // typing width when the bar wraps.
    <div className="relative min-w-[220px] max-w-[320px] flex-1">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
      />
      <Input
        value={filter.value}
        onChange={(event) => filter.onChange(event.target.value)}
        placeholder={filter.placeholder ?? "Search…"}
        aria-label={filter.label}
        className="pl-8 text-sub"
      />
    </div>
  );
}

function SelectFilter({
  filter,
}: {
  filter: Extract<TableFilter, { kind: "select" }>;
}) {
  // Radix's dropdown has no search, so past the threshold the same single
  // choice is offered through the searchable picker instead. The screen's API
  // is unchanged either way — one string in, one string out.
  if (filter.searchable ?? filter.options.length > SEARCHABLE_THRESHOLD) {
    return (
      <OptionPicker
        multiple={false}
        label={filter.placeholder ?? filter.label}
        options={filter.options}
        width={filter.width}
        searchable={filter.searchable}
        selected={
          filter.value === "" ? EMPTY_SELECTION : new Set([filter.value])
        }
        onPick={(value) => filter.onChange(value)}
        onClear={() => filter.onChange("")}
      />
    );
  }

  // "Nothing chosen" is not the same as "no value": this filter expresses it
  // as a real option, so the trigger would show that option's label in
  // full-strength ink and read as an active filter. Every other control on the
  // bar greys its resting state, so a row of them was half dark and half faded
  // with no rule behind it.
  const unset = filter.value === "";

  return (
    <Select
      value={unset ? ALL_VALUE : filter.value}
      onValueChange={(next) => filter.onChange(next === ALL_VALUE ? "" : next)}
    >
      <SelectTrigger
        aria-label={filter.label}
        className={cn("text-sub", unset && "text-ink-muted")}
        style={{ width: filter.width ?? "160px" }}
      >
        <SelectValue placeholder={filter.placeholder ?? filter.label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>
          {filter.placeholder ?? filter.label}
        </SelectItem>
        {filter.options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * The popover both searchable filters are built from: a list of options with an
 * optional search box, shaped like the plain dropdown beside it so a row of
 * filters reads as one set of controls.
 *
 * It knows nothing about single vs. multiple — the caller hands it the current
 * selection, what a pick means and whether a pick closes it. That is the whole
 * difference between the two, so there is only one list, one search box and one
 * set of metrics to keep in step.
 */
function OptionPicker({
  label,
  options,
  width,
  searchable,
  selected,
  multiple,
  onPick,
  onClear,
}: {
  label: string;
  options: readonly FilterBarOption[];
  width?: string;
  searchable?: boolean;
  selected: ReadonlySet<string>;
  /** Checkbox rows that keep the list open, rather than a single tick. */
  multiple: boolean;
  onPick: (value: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const count = selected.size;
  const withSearch = searchable ?? options.length > SEARCHABLE_THRESHOLD;
  const shown = withSearch
    ? options.filter((option) =>
        option.label.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : options;

  const close = (): void => {
    setOpen(false);
    setSearch("");
  };

  // The trigger says what is applied rather than listing it. One chosen value
  // fits and is the most useful thing it can say; several do not, and a
  // truncated list of four company names answers nothing — so a multi-select
  // shows its count instead.
  const chosen =
    !multiple && count === 1
      ? options.find((option) => selected.has(option.value))
      : undefined;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : close())}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={count > 0 ? `${label} (${count} selected)` : label}
          // The `.select` shell, so this sits level with the plain dropdowns
          // either side of it.
          className={cn(
            "flex h-9 items-center justify-between gap-2 whitespace-nowrap rounded-sm border border-line-strong bg-surface px-[11px] text-sub transition-colors focus:border-blue focus:shadow-focus focus:outline-none",
            count > 0 ? "text-ink" : "text-ink-muted",
          )}
          style={{ width: width ?? "160px" }}
        >
          <span className="truncate">{chosen ? chosen.label : label}</span>
          {multiple && count > 0 ? (
            <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-blue px-1 text-[10px] font-bold leading-none tabular-nums text-white">
              {count}
            </span>
          ) : (
            <ListFilter className="size-3.5 shrink-0 text-ink-muted" />
          )}
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
                  role={multiple ? "checkbox" : undefined}
                  aria-checked={multiple ? checked : undefined}
                  onClick={() => {
                    onPick(option.value);
                    // Single-select closes on choice; multi-select stays open
                    // so several values can be picked without reopening it.
                    if (!multiple) close();
                  }}
                  className="flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-left text-meta text-ink-body transition-colors hover:bg-surface-sub"
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center",
                      multiple &&
                        cn(
                          "rounded-[4px] border",
                          checked
                            ? "border-blue bg-blue text-white"
                            : "border-line-strong",
                        ),
                    )}
                  >
                    {checked &&
                      (multiple ? (
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
        {count > 0 && (
          <div className="border-t border-line p-1">
            <button
              type="button"
              onClick={() => {
                onClear();
                close();
              }}
              className="w-full rounded-xs px-2 py-1.5 text-left text-meta font-[550] text-blue-ink transition-colors hover:bg-surface-sub"
            >
              {multiple ? `Clear (${count})` : "Clear"}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function MultiSelectFilter({
  filter,
}: {
  filter: Extract<TableFilter, { kind: "multiselect" }>;
}) {
  return (
    <OptionPicker
      multiple
      label={filter.label}
      options={filter.options}
      width={filter.width}
      searchable={filter.searchable}
      selected={filter.value}
      onPick={(value) => {
        const next = new Set(filter.value);
        if (next.has(value)) next.delete(value);
        else next.add(value);
        filter.onChange(next);
      }}
      onClear={() => filter.onChange(new Set())}
    />
  );
}

/**
 * The column-visibility popover. Every column is listed; a required one renders
 * as a disabled, checked row rather than disappearing, so the list always says
 * what the table is made of.
 */
function ColumnsPopover({
  columns,
  isColumnVisible,
  onToggleColumn,
}: {
  columns: readonly ColumnDef[];
  isColumnVisible: (key: string) => boolean;
  onToggleColumn: (key: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline">
          <SlidersHorizontal className="size-4" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-3">
        <p className="mb-2 text-sub font-semibold text-ink">Toggle Columns</p>
        <div className="mb-3 h-px bg-line" />
        <div className="flex flex-col gap-2">
          {columns.map((column) => {
            const checked = isColumnVisible(column.key);
            return (
              <button
                key={column.key}
                type="button"
                role="checkbox"
                aria-checked={checked}
                disabled={column.required}
                onClick={() => onToggleColumn(column.key)}
                className="flex items-center gap-2 text-left text-sub text-ink-body disabled:cursor-default disabled:opacity-60"
              >
                <span
                  className={cn(
                    "flex size-[15px] shrink-0 items-center justify-center rounded-[4px] border",
                    checked
                      ? "border-blue bg-blue text-white"
                      : "border-line-strong",
                  )}
                >
                  {checked && <Check className="size-3" strokeWidth={3} />}
                </span>
                <span className="flex-1 truncate">{column.label}</span>
                {column.required && (
                  <span className="text-meta text-ink-faint">(required)</span>
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * The search/filter/column-toggle row above a data table — fh-core's
 * `TableFilterBar`.
 *
 * Every filter a table offers lives here, on one bordered strip above the
 * table, rather than behind an icon in each column header: a reader can see
 * what is applied without opening anything, and the strip works identically on
 * a phone, where there is no header row to hang a control off.
 *
 * Purely presentational. Values come in and changes go straight back out, so
 * filter state stays with the screen that owns the query.
 */
export function TableFilterBar({
  filters = [],
  columns,
  isColumnVisible,
  onToggleColumn,
  onExport,
  exportLabel = "Export",
  onClearFilters,
  children,
  surface = "canvas",
  className,
}: TableFilterBarProps) {
  const canClear = onClearFilters !== undefined && filters.some(isActive);
  const showColumns =
    columns !== undefined &&
    columns.length > 0 &&
    isColumnVisible !== undefined &&
    onToggleColumn !== undefined;

  return (
    // A plain div rather than a Card: Card's base is `flex flex-col`, which
    // would stack the controls vertically. This is an explicit horizontal row
    // that wraps.
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 bg-surface",
        surface === "canvas"
          ? "rounded-md border border-line p-2.5 shadow-e1"
          : "border-b border-line px-4 py-2.5",
        className,
      )}
    >
      {filters.map((filter) => {
        switch (filter.kind) {
          case "search":
            return <SearchFilter key={filter.key} filter={filter} />;
          case "select":
            return <SelectFilter key={filter.key} filter={filter} />;
          case "multiselect":
            return <MultiSelectFilter key={filter.key} filter={filter} />;
          case "custom":
            return <div key={filter.key}>{filter.render()}</div>;
        }
      })}

      {children}

      {/* After the controls it clears, and only once there is something to
          clear — a permanently visible Clear on an unfiltered list is a button
          that does nothing, which teaches people to ignore it.

          "Clear" rather than "Clear filters": the longer label pushed this bar
          from one row to two the moment anybody filtered, so the table jumped
          down as a reward for using it. The full wording stays as the
          accessible name, where it costs no width. */}
      {canClear && (
        <Button
          type="button"
          variant="ghost"
          aria-label="Clear filters"
          onClick={onClearFilters}
        >
          <X className="size-4" />
          Clear
        </Button>
      )}

      {(showColumns || onExport) && (
        <div className="flex items-center gap-2 sm:ml-auto">
          {showColumns && (
            <ColumnsPopover
              columns={columns}
              isColumnVisible={isColumnVisible}
              onToggleColumn={onToggleColumn}
            />
          )}
          {onExport && (
            <Button type="button" variant="outline" onClick={onExport}>
              <Download className="size-4" />
              {exportLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
