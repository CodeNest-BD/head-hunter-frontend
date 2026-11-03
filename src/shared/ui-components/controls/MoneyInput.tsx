"use client";

import { forwardRef, type ComponentProps } from "react";

import { cn } from "@/shared/libs/shadCnConfig";
import { groupThousands } from "@/shared/utils/money";
import { Input } from "./input";
import { NumericInput, sanitizeNumeric } from "./NumericInput";

/**
 * Rewrites a money field's text with thousands separators and returns its bare
 * value. Done on the element during the change event so the caret can be put
 * back after the digit it followed; a controlled re-render alone would throw it
 * to the end every time a comma appeared.
 */
function regroupMoneyInput(input: HTMLInputElement, decimal: boolean): string {
  const caret = input.selectionStart ?? input.value.length;
  const charsBeforeCaret = sanitizeNumeric(
    input.value.slice(0, caret),
    decimal,
  ).length;
  const bare = sanitizeNumeric(input.value, decimal);
  const grouped = groupThousands(bare);
  let nextCaret = 0;
  let seen = 0;
  while (nextCaret < grouped.length && seen < charsBeforeCaret) {
    if (grouped[nextCaret] !== ",") seen++;
    nextCaret++;
  }
  input.value = grouped;
  input.setSelectionRange(nextCaret, nextCaret);
  return bare;
}

interface MoneyInputProps
  extends Omit<ComponentProps<typeof NumericInput>, "value" | "onChange"> {
  /** The bare figure ("1000000"); commas are display only. */
  value: string;
  onChange: (value: string) => void;
}

/**
 * A money field with a leading "$" adornment that reads "1,000,000" while the
 * form holds the bare digits every parser expects. Numeric-only: digits and one
 * dot, or digits alone under `decimal={false}` for a figure that must be whole.
 *
 * Every money field in the app goes through this one component — a plain
 * `NumericInput` on an amount shows a recruiter "30000" where they typed a
 * salary, which is the report this was lifted out of `JobForm` to fix.
 */
export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  (
    { className, decimal = true, value, onChange, inputMode, ...props },
    ref,
  ) => (
    <div className="relative">
      <span className="pointer-events-none absolute left-[11px] top-1/2 -translate-y-1/2 text-sub text-ink-faint">
        $
      </span>
      <Input
        ref={ref}
        type="text"
        inputMode={inputMode ?? (decimal ? "decimal" : "numeric")}
        className={cn("pl-6 tabular-nums", className)}
        // Sanitized here too: a prefilled value may be legacy free text such
        // as "$50M".
        value={groupThousands(sanitizeNumeric(value, decimal))}
        onChange={(event) =>
          onChange(regroupMoneyInput(event.currentTarget, decimal))
        }
        {...props}
      />
    </div>
  ),
);
MoneyInput.displayName = "MoneyInput";
