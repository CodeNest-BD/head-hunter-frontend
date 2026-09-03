import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumber,
  type CountryCode,
} from "libphonenumber-js";
import { z } from "zod";

import type { SelectOption } from "@/shared/ui-components/controls/SearchableSelect";

export type { CountryCode };

/** US-based marketplace, so the picker starts on the US; users can switch. */
export const DEFAULT_COUNTRY: CountryCode = "US";

// Resolved once. Wrapped in a factory because Intl.DisplayNames can be absent
// in exotic runtimes; the fallback is the raw ISO code.
const regionNames = (() => {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    return null;
  }
})();

/** Human country name for an ISO-3166 alpha-2 code ("US" → "United States"). */
export function countryName(code: CountryCode): string {
  return regionNames?.of(code) ?? code;
}

/** The flag emoji for an ISO-3166 alpha-2 code, built from regional indicators. */
export function countryFlag(code: CountryCode): string {
  const A = 0x1f1e6;
  const first = A + (code.charCodeAt(0) - 65);
  const second = A + (code.charCodeAt(1) - 65);
  return String.fromCodePoint(first, second);
}

/** `+1`, `+44`, … for a country. */
export function callingCode(code: CountryCode): string {
  return `+${getCountryCallingCode(code)}`;
}

/**
 * Options for the country picker: flag + name + dialling code in the label (so
 * searching by name or code both work), keyed by ISO code. Built once.
 */
export const COUNTRY_OPTIONS: readonly SelectOption[] = getCountries()
  .map((code) => ({
    value: code,
    label: `${countryFlag(code)} ${countryName(code)} ${callingCode(code)}`,
  }))
  .sort((a, b) => a.label.localeCompare(b.label, "en-US"));

/** Split an E.164 string into its country and national digits for the input to
 * seed from. Falls back to the default country and bare digits when it can't be
 * parsed (e.g. a partial number). */
export function parseE164(value: string): {
  country: CountryCode;
  national: string;
} {
  if (value) {
    try {
      const parsed = parsePhoneNumber(value);
      if (parsed?.country) {
        return { country: parsed.country, national: parsed.nationalNumber };
      }
    } catch {
      // fall through to the digit-strip fallback
    }
  }
  return { country: DEFAULT_COUNTRY, national: value.replace(/\D/g, "") };
}

/** E.164 for a country + national digits, or "" when there are no digits. */
export function toE164(country: CountryCode, nationalDigits: string): string {
  const digits = nationalDigits.replace(/\D/g, "");
  return digits ? `+${getCountryCallingCode(country)}${digits}` : "";
}

/** Pretty, as-you-type national formatting for display in the input. */
export function formatNational(
  country: CountryCode,
  nationalDigits: string,
): string {
  const digits = nationalDigits.replace(/\D/g, "");
  return new AsYouType(country).input(digits);
}

/**
 * Validates an E.164 phone (any country) — the wire shape every form submits.
 * Required; use `.optional()`/`.or(z.literal(""))` at the call site for optional
 * fields.
 */
export const phoneSchema = z
  .string()
  .trim()
  .refine((value) => isValidPhoneNumber(value), "Enter a valid phone number");
