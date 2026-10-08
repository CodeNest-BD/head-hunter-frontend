"use client";

import { useState, type ReactNode } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

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
} from "@/shared/ui-components/controls/select";

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
      /** The quiet prefix on the trigger — what the filter is ("Status"). */
      label: string;
      options: readonly FilterBarOption[];
      /** `""` means unfiltered — the shape the screens' query state uses. */
      value: string;
      onChange: (next: string) => void;
      /** What "no filter" reads as, on the trigger and in the list. */
      allLabel?: string;
      /** CSS width for the trigger. Defaults to 160px. */
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
      allLabel?: string;
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
   * strip above the table card. `bare` drops the frame entirely, for a panel
   * that already has a border and a title — there the controls belong on the
   * card's own head rather than in a second box drawn inside the first.
   */
  surface?: "canvas" | "bare";
  className?: string;
}

/** Past this many options a filter grows its own search box. */
const SEARCHABLE_THRESHOLD = 8;

/** What a filter reads as when it is not narrowing anything. */
const ALL = "All";

/** Shared so an unfiltered dropdown does not allocate a Set on every render. */
const EMPTY_SELECTION: ReadonlySet<string> = new Set();

/**
 * The stand-in Radix needs for an option that means "everything".
 *
 * Radix reserves the empty string: `value=""` on a Select means NO VALUE, so it
 * shows the placeholder instead of the chosen option. Every screen here spells
 * "no filter" as `''`, and each one would render a blank control once "All"
 * was picked — which reads as a filter that failed to apply rather than one
 * deliberately set to everything.
 *
 * Translating at the boundary keeps the sentinel entirely inside this file: the
 * screens above still hand us `''` and still receive `''` back.
 */
const ALL_VALUE = "__all__";

/** The width every dropdown-shaped filter defaults to. */
const TRIGGER_WIDTH = "160px";

/** A multi-select needs the extra room its "n selected" reading costs. */
const MULTI_TRIGGER_WIDTH = "180px";

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

/**
 * What every dropdown-shaped trigger says: the filter's name in quiet ink, then
 * what it is currently set to in full strength.
 *
 * Naming the filter on the face of the control is what lets a row of them be
 * read at a glance — four triggers reading "All" tell you nothing about which
 * is which, and a bare "Published" does not say it is the status.
 */
function TriggerLabel({ label, value }: { label: string; value: string }) {
  return (
    // `!flex` because SelectTrigger pins `[&>span]:line-clamp-1` on its direct
    // child, and line-clamp is `display: -webkit-box` — which silently wins
    // over this flex and closes the gap, so the trigger read "StatusAll".
    <span className="!flex min-w-0 items-center gap-1.5">
      <span className="shrink-0 text-ink-muted">{label}</span>
      <span className="truncate font-[550] text-ink">{value}</span>
    </span>
  );
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
  const allLabel = filter.allLabel ?? ALL;

  // Radix's dropdown has no search, so past the threshold the same single
  // choice is offered through the searchable picker instead. The screen's API
  // is unchanged either way — one string in, one string out.
  if (filter.searchable ?? filter.options.length > SEARCHABLE_THRESHOLD) {
    return (
      <OptionPicker
        multiple={false}
        label={filter.label}
        allLabel={allLabel}
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

  const chosen = filter.options.find((option) => option.value === filter.value);

  return (
    <Select
      value={filter.value === "" ? ALL_VALUE : filter.value}
      onValueChange={(next) => filter.onChange(next === ALL_VALUE ? "" : next)}
    >
      <SelectTrigger
        aria-label={filter.label}
        className="text-sub"
        style={{ width: filter.width ?? TRIGGER_WIDTH }}
      >
        <TriggerLabel label={filter.label} value={chosen?.label ?? allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>{allLabel}</SelectItem>
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
 * optional search box, shaped like the plain dropdown beside it — same height,
 * same label-then-value face, same caret — so a row of filters reads as one set
 * of controls rather than two kinds of thing.
 *
 * It knows nothing about single vs. multiple — the caller hands it the current
 * selection, what a pick means and whether a pick closes it. That is the whole
 * difference between the two, so there is only one list, one search box and one
 * set of metrics to keep in step.
 */
function OptionPicker({
  label,
  allLabel,
  options,
  width,
  searchable,
  selected,
  multiple,
  onPick,
  onClear,
}: {
  /** The control's name — the quiet prefix, and its accessible name. */
  label: string;
  /** What the trigger reads while nothing is chosen. */
  allLabel: string;
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

  // One chosen value fits and is the most useful thing the trigger can say,
  // whether or not more could have been picked; several do not, and a
  // truncated list of four company names answers nothing — so past one a
  // multi-select reports how many instead.
  const chosen = options.find((option) => selected.has(option.value));
  const value =
    count === 0
      ? allLabel
      : count === 1
        ? (chosen?.label ?? allLabel)
        : `${count} selected`;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : close())}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          // The `.select` shell, so this sits level with the plain dropdowns
          // either side of it and wears the same caret.
          className="flex h-9 items-center justify-between gap-2 whitespace-nowrap rounded-sm border border-line-strong bg-surface px-[11px] text-sub transition-colors focus:border-blue focus:shadow-focus focus:outline-none"
          style={{
            width: width ?? (multiple ? MULTI_TRIGGER_WIDTH : TRIGGER_WIDTH),
          }}
        >
          <TriggerLabel label={label} value={value} />
          <ChevronDown
            aria-hidden="true"
            className="size-3 shrink-0 text-ink-muted"
            strokeWidth={2.5}
          />
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
      allLabel={filter.allLabel ?? ALL}
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
 * The search/filter row above a data table.
 *
 * Every filter a table offers lives here, on one strip above the table, rather
 * than behind an icon in each column header: a reader can see what is applied
 * without opening anything, and the strip works identically on a phone, where
 * there is no header row to hang a control off.
 *
 * Purely presentational. Values come in and changes go straight back out, so
 * filter state stays with the screen that owns the query.
 */
export function TableFilterBar({
  filters = [],
  onClearFilters,
  children,
  surface = "canvas",
  className,
}: TableFilterBarProps) {
  const canClear = onClearFilters !== undefined && filters.some(isActive);

  return (
    // A plain div rather than a Card: Card's base is `flex flex-col`, which
    // would stack the controls vertically. This is an explicit horizontal row
    // that wraps.
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        surface === "canvas" &&
          "rounded-md border border-line bg-surface p-2.5 shadow-e1",
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
    </div>
  );
}
