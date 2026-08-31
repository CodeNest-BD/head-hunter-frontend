"use client";

import { cn } from "@/shared/libs/shadCnConfig";
import {
  US_DIALING_CODE,
  formatUsPhoneDigits,
  toUsPhoneDigits,
} from "@/shared/libs/usPhone";
import { Input } from "./input";

interface UsPhoneInputProps {
  /** The national number as bare digits — at most 10, no country code. */
  value: string;
  onChange: (digits: string) => void;
  onBlur?: () => void;
  id?: string;
  invalid?: boolean;
  className?: string;
}

/**
 * US-only phone entry: the +1 country code is fixed chrome rather than a field,
 * and the input accepts digits alone. The value handed to the caller is always
 * bare digits, so a form stores one shape no matter how the number was typed
 * or pasted.
 */
export function UsPhoneInput({
  value,
  onChange,
  onBlur,
  id,
  invalid,
  className,
}: UsPhoneInputProps) {
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 flex items-center gap-1.5 border-r border-input pl-3 pr-2.5 text-sm text-muted-foreground"
      >
        <span className="text-base leading-none">🇺🇸</span>
        {US_DIALING_CODE}
      </span>
      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        aria-invalid={invalid ? true : undefined}
        value={formatUsPhoneDigits(value)}
        onChange={(event) => onChange(toUsPhoneDigits(event.target.value))}
        onBlur={onBlur}
        placeholder="202 555 0100"
        className={cn(
          "pl-[4.75rem]",
          invalid && "border-destructive",
          className,
        )}
      />
      <span className="sr-only">
        United States phone number, country code {US_DIALING_CODE}
      </span>
    </div>
  );
}
