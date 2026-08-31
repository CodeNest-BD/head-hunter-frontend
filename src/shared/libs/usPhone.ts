import { z } from "zod";

export const US_PHONE_DIGITS = 10;
export const US_DIALING_CODE = "+1";

/** Strips everything but digits and caps the result at a US national number,
 * so a paste of "+1 (202) 555-0100" still yields exactly "2025550100". */
export function toUsPhoneDigits(value: string): string {
  return value.replace(/\D/g, "").slice(-US_PHONE_DIGITS);
}

/** Groups digits for display: "202", "202 555", "202 555 0100". */
export function formatUsPhoneDigits(digits: string): string {
  const area = digits.slice(0, 3);
  const prefix = digits.slice(3, 6);
  const line = digits.slice(6, US_PHONE_DIGITS);
  return [area, prefix, line].filter(Boolean).join(" ");
}

/** The wire shape the API expects: +1 followed by the national digits. */
export function toE164UsPhone(digits: string): string {
  return `${US_DIALING_CODE}${digits}`;
}

export const usPhoneDigitsPattern = new RegExp(`^\\d{${US_PHONE_DIGITS}}$`);

/** The phone field every form that collects one uses: bare national digits,
 * exactly as `UsPhoneInput` produces them. */
export const usPhoneDigitsSchema = z
  .string()
  .trim()
  .regex(
    usPhoneDigitsPattern,
    `Enter a ${US_PHONE_DIGITS}-digit US phone number`,
  );
