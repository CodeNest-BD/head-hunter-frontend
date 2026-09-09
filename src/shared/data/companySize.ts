/**
 * Standard company-size buckets for the "Number of Employees" field. A fixed
 * list (picked, not typed) keeps the field free of stray text while preserving
 * the range semantics the field always had ("51-200"). Stored as the label
 * string, so the value is human-readable wherever it's shown.
 */
export const COMPANY_SIZE_OPTIONS = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001-5000",
  "5001-10000",
  "10000+",
] as const;

const CANONICAL_SIZES = new Set<string>(COMPANY_SIZE_OPTIONS);

/**
 * The buckets to offer a picker, given every value it may be asked to show —
 * what the field holds now, plus anything about to be written into it.
 *
 * The column is a free-text varchar that predates this list, so a profile can
 * hold a bucket that is not on it ("31-50"). Radix's Select does not merely
 * fail to display such a value: its hidden native select coerces a value with
 * no matching option to "" and fires a change, which clears the field. An
 * incoming value therefore has to be offered in the *same* render it arrives,
 * not the one after — hence taking the pending value here too.
 */
export function companySizeOptions(
  ...selectable: readonly string[]
): readonly string[] {
  const offList = new Set<string>();
  for (const value of selectable) {
    const trimmed = value.trim();
    if (trimmed !== "" && !CANONICAL_SIZES.has(trimmed)) offList.add(trimmed);
  }
  if (offList.size === 0) return COMPANY_SIZE_OPTIONS;
  return [...offList, ...COMPANY_SIZE_OPTIONS];
}
