"use client";

import * as React from "react";

import { Input } from "./input";

interface NumericInputProps
  extends Omit<React.ComponentProps<"input">, "type"> {
  /** Allow a single decimal point (money, rates); default is integer-only. */
  decimal?: boolean;
}

/**
 * A text-safe number field: keystrokes and pastes are stripped to digits (plus a
 * single dot when `decimal`), so a number field can never hold letters or stray
 * punctuation. Drop-in for `<Input>` and works with react-hook-form `register`
 * (it sanitizes the value on the event, then forwards it to the given onChange),
 * so every numeric field across the app enforces numbers the same way.
 */
export const NumericInput = React.forwardRef<
  HTMLInputElement,
  NumericInputProps
>(({ decimal = false, onChange, inputMode, ...props }, ref) => {
  const sanitize = (raw: string): string => {
    // Integer mode truncates at the first dot rather than deleting it: simply
    // stripping non-digits turned a pasted "130000.50" into "13000050", which
    // on a money field is a hundredfold error the user cannot see happening.
    if (!decimal) return raw.split(".")[0].replace(/\D/g, "");
    // Digits and at most one dot.
    const cleaned = raw.replace(/[^\d.]/g, "");
    const dot = cleaned.indexOf(".");
    if (dot === -1) return cleaned;
    return (
      cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, "")
    );
  };

  return (
    <Input
      ref={ref}
      type="text"
      inputMode={inputMode ?? (decimal ? "decimal" : "numeric")}
      onChange={(event) => {
        const cleaned = sanitize(event.target.value);
        // Rewrite the value in place so both the field (uncontrolled register)
        // and the forwarded handler see only the sanitized string.
        if (cleaned !== event.target.value) event.target.value = cleaned;
        onChange?.(event);
      }}
      {...props}
    />
  );
});

NumericInput.displayName = "NumericInput";
