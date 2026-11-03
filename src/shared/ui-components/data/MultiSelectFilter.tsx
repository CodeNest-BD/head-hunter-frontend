"use client";

import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { MENU_OPTION_LIST } from "@/shared/ui-components/controls/menuStyles";
import type { FilterOption } from "./MobileFilters";

export interface MultiSelectFilterProps {
  /** The control's own name, e.g. "Stage" — shown when nothing is chosen. */
  label: string;
  options: readonly FilterOption[];
  /** The chosen values. Empty means unfiltered, which is how the list reads it. */
  value: readonly string[];
  onChange: (next: readonly string[]) => void;
  className?: string;
}

/**
 * A toolbar filter that takes several values at once.
 *
 * The app's other filters (`ToolbarSelect`, `FilterSelect`) are single-choice:
 * one value or none. That cannot express the question a reader actually asks
 * of a pipeline — "show me everyone who hasn't finished" spans four stages —
 * so this is the multi-value sibling rather than a fourth filter idiom. It
 * borrows `ColumnsToggle`'s checkbox-menu markup, which is already this app's
 * way of ticking several things in a dropdown.
 *
 * Empty `value` means no filter at all, not "none selected": a filter that
 * could be narrowed to nothing would show an empty list with no way back.
 */
export function MultiSelectFilter({
  label,
  options,
  value,
  onChange,
  className,
}: MultiSelectFilterProps) {
  // O(1) per option rather than a scan of `value` inside the map.
  const chosen = new Set(value);

  const toggle = (optionValue: string): void => {
    const next = new Set(chosen);
    if (next.has(optionValue)) {
      next.delete(optionValue);
    } else {
      next.add(optionValue);
    }
    // Emitted in the options' own order, not click order, so the value is
    // stable: it feeds a query key, and a set that reordered itself on every
    // click would refetch each time.
    onChange(options.filter((o) => next.has(o.value)).map((o) => o.value));
  };

  // Named rather than counted while it fits: "Stage: Offered" says more at a
  // glance than "Stage · 1", and the count takes over once naming them all
  // would outgrow the control.
  const summary =
    chosen.size === 0
      ? label
      : chosen.size === 1
        ? `${label}: ${options.find((o) => chosen.has(o.value))?.label ?? ""}`
        : `${label}: ${chosen.size} selected`;

  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <button
          type="button"
          // Deliberately the same shell as `ToolbarSelect`/`NativeSelect` —
          // 38px, the same border, the same soft active tint. It sits beside
          // them, so anything of its own would read as a different kind of
          // control rather than as the multi-value one.
          className={cn(
            "inline-flex h-9.5 shrink-0 cursor-pointer items-center gap-2 rounded-sm border border-line-strong bg-surface pl-[11px] pr-[9px] text-sub text-ink transition-colors",
            "focus-visible:border-blue focus-visible:shadow-focus focus-visible:outline-none",
            chosen.size > 0 &&
              "border-blue/35 bg-tint/60 font-medium text-blue-ink",
            className,
          )}
        >
          {summary}
          <ChevronDown
            aria-hidden="true"
            className="size-3 shrink-0 text-ink-faint"
          />
        </button>
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align="start"
          sideOffset={4}
          className={cn(
            "z-50 min-w-[200px] rounded-sm border border-line bg-surface p-1 shadow-pop",
            MENU_OPTION_LIST,
          )}
        >
          {options.map((option) => {
            const checked = chosen.has(option.value);
            return (
              <Dropdown.CheckboxItem
                key={option.value}
                checked={checked}
                // Without this the menu closes on the first tick, which makes
                // choosing three stages three round trips through the trigger.
                onSelect={(event) => {
                  event.preventDefault();
                  toggle(option.value);
                }}
                className="flex cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-1.5 text-sub text-ink-body outline-none hover:bg-surface-sub focus:bg-surface-sub"
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
                {option.label}
              </Dropdown.CheckboxItem>
            );
          })}
          {chosen.size > 0 && (
            <Dropdown.Item
              onSelect={() => onChange([])}
              className="cursor-pointer rounded-xs px-2.5 py-1.5 text-sub font-[550] text-blue-ink outline-none hover:bg-surface-sub focus:bg-surface-sub"
            >
              Clear {label.toLowerCase()}
            </Dropdown.Item>
          )}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
