import { formatMinor } from "@/shared/utils/money";

type SalaryRange = {
  salaryMinMinor: number | null;
  salaryMaxMinor: number | null;
};

/**
 * The advertised salary for a listing summary, or null when the company left
 * it off — an open-ended range reads as "From"/"Up to" rather than pairing a
 * single bound with an em dash.
 *
 * No rate period: listings are quoted annually, so stating it on every card
 * would be noise.
 */
export function formatSalaryRange({
  salaryMinMinor: min,
  salaryMaxMinor: max,
}: SalaryRange): string | null {
  if (min === null && max === null) return null;
  if (min !== null && max !== null) {
    return `${formatMinor(min)} – ${formatMinor(max)}`;
  }
  return min !== null
    ? `From ${formatMinor(min)}`
    : `Up to ${formatMinor(max)}`;
}
