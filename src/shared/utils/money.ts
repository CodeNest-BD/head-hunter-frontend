/**
 * The API speaks integer minor units (cents); people speak major units
 * (dollars). Every conversion goes through here rather than being inlined at
 * call sites — getting it wrong is a 100x error in a money field.
 */

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
