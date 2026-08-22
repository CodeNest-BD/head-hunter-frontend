/**
 * The API speaks integer minor units (cents); people speak major units
 * (dollars). Every conversion goes through here rather than being inlined at
 * call sites — getting it wrong is a 100x error in a money field.
 */

/**
 * Mirrors the backend's MAX_MONEY_MINOR (100_000_000_000 minor units) hard
 * ceiling, in the major units these forms collect — $1,000,000,000. Bound
 * every money form field at this value so an oversized amount is rejected as
 * the user types rather than surviving a round-trip to the API only to come
 * back as a 400 (or, before that backend bound existed, as unrecoverable
 * bigint overflow — see the incident this constant closes off).
 */
export const MAX_MONEY_MAJOR = 1_000_000_000;

/**
 * Formatted once here so every "must be under..." message across the money
 * forms reads identically to the backend's own `MAX_MONEY_LABEL` — same
 * amount, same formatting, no independently-typed "$1,000,000,000" literal
 * to drift out of sync.
 */
export const MAX_MONEY_MAJOR_LABEL = formatMinor(majorToMinor(MAX_MONEY_MAJOR));

/**
 * A plausibility ceiling for an annual salary, in major units — $10,000,000.
 * Far below MAX_MONEY_MAJOR, which is a safety bound (keeping values inside
 * JavaScript's exact-integer range), not a realistic one. This one exists to
 * catch the actual mistake: a held-down zero key. The incident that prompted
 * it was an entry of $500,000,000,000,000 in a salary field.
 */
export const MAX_SALARY_MAJOR = 10_000_000;

/** Formatted once here for the same reason as MAX_MONEY_MAJOR_LABEL. */
export const MAX_SALARY_MAJOR_LABEL = formatMinor(
  majorToMinor(MAX_SALARY_MAJOR),
);

/** 250000 -> 2500 */
export function minorToMajor(minor: number): number {
  return minor / 100;
}

/** 2500 -> 250000. Rounds, so 2500.005 cannot produce a fractional cent. */
export function majorToMinor(major: number): number {
  return Math.round(major * 100);
}

/**
 * Form inputs hand back strings, and an empty field must mean "unset" rather
 * than zero — a blank commission range is not a $0 commission range.
 *
 * Returns null rather than undefined for an emptied field, because the two mean
 * different things over the wire: axios omits undefined, which the API reads as
 * "leave unchanged", so a user could never clear a value once set. null clears.
 */
export function majorInputToMinor(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? majorToMinor(parsed) : null;
}

/** Fills a form field from an API value; null/undefined render as empty. */
export function minorToMajorInput(minor: number | null | undefined): string {
  return minor === null || minor === undefined
    ? ""
    : String(minorToMajor(minor));
}

/** Display helper: 250000 -> "$2,500". Cents shown only when non-zero. */
export function formatMinor(
  minor: number | null | undefined,
  currency = "USD",
): string {
  if (minor === null || minor === undefined) return "—";
  const major = minorToMajor(minor);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(major) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(major);
}
