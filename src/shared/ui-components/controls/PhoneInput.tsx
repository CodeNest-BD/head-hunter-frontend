"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/shared/libs/shadCnConfig";
import {
  COUNTRY_OPTIONS,
  DEFAULT_COUNTRY,
  callingCode,
  countryFlag,
  formatNational,
  parseE164,
  toE164,
  type CountryCode,
} from "@/shared/libs/phone";
import { Input } from "./input";
import { SearchableSelect } from "./SearchableSelect";

interface PhoneInputProps {
  /** The phone in E.164 (`+441234…`), or "" when empty. */
  value: string;
  onChange: (e164: string) => void;
  onBlur?: () => void;
  id?: string;
  invalid?: boolean;
  className?: string;
}

/**
 * An international phone entry: a searchable country picker (flag + dialling
 * code, reusing {@link SearchableSelect}) beside a national-number field that
 * auto-formats as you type. The value in and out is always E.164, so a form
 * stores one wire shape for any country. Seeds its country/number from the
 * incoming E.164 (e.g. a profile that loads after mount).
 */
export function PhoneInput({
  value,
  onChange,
  onBlur,
  id,
  invalid,
  className,
}: PhoneInputProps) {
  const seed = parseE164(value);
  const [country, setCountry] = useState<CountryCode>(seed.country);
  const [national, setNational] = useState<string>(seed.national);
  // Tracks what we last emitted, so the sync effect can tell an external value
  // change (profile load, reset) from the echo of our own onChange.
  const lastEmitted = useRef<string>(value);

  useEffect(() => {
    if (value === lastEmitted.current) return;
    // External change — reseed the country and number from it.
    const next = parseE164(value);
    setCountry(next.country);
    setNational(next.national);
    lastEmitted.current = value;
  }, [value]);

  const emit = (nextCountry: CountryCode, nationalDigits: string): void => {
    const e164 = toE164(nextCountry, nationalDigits);
    lastEmitted.current = e164;
    onChange(e164);
  };

  const onCountryChange = (next: string | null): void => {
    const nextCountry = (next ?? DEFAULT_COUNTRY) as CountryCode;
    setCountry(nextCountry);
    emit(nextCountry, national);
  };

  const onNationalChange = (raw: string): void => {
    const digits = raw.replace(/\D/g, "");
    setNational(digits);
    emit(country, digits);
  };

  return (
    <div className="flex items-stretch gap-2">
      <div className="w-[7.5rem] shrink-0">
        <SearchableSelect
          options={COUNTRY_OPTIONS}
          value={country}
          onChange={onCountryChange}
          searchPlaceholder="Search countries…"
          contentClassName="w-[20rem]"
          renderValue={(selected) => {
            const code = (selected?.value ?? country) as CountryCode;
            return (
              <span className="flex items-center gap-1.5">
                <span className="text-base leading-none">
                  {countryFlag(code)}
                </span>
                <span className="text-muted-foreground">
                  {callingCode(code)}
                </span>
              </span>
            );
          }}
        />
      </div>
      <Input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        aria-invalid={invalid ? true : undefined}
        value={formatNational(country, national)}
        onChange={(event) => onNationalChange(event.target.value)}
        onBlur={onBlur}
        placeholder="Phone number"
        className={cn("flex-1", invalid && "border-destructive", className)}
      />
    </div>
  );
}
