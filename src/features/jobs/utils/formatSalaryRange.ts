import { formatMinor } from "@/shared/utils/money";

import { SALARY_RATE_PERIOD_SUFFIX, type SalaryRatePeriod } from "../schemas";

type SalaryRange = {
  salaryMinMinor: number | null;
  salaryMaxMinor: number | null;
  salaryRatePeriod: SalaryRatePeriod | null;
};

/**
 * The advertised salary for a listing summary, or null when the company left
 * it off — an open-ended range reads as "From"/"Up to" rather than pairing a
 * single bound with an em dash.
 */
export function formatSalaryRange({
  salaryMinMinor: min,
  salaryMaxMinor: max,
  salaryRatePeriod,
}: SalaryRange): string | null {
  if (min === null && max === null) return null;

  const suffix = salaryRatePeriod
    ? ` ${SALARY_RATE_PERIOD_SUFFIX[salaryRatePeriod]}`
    : "";
  if (min !== null && max !== null) {
    return `${formatMinor(min)} – ${formatMinor(max)}${suffix}`;
  }
  return min !== null
    ? `From ${formatMinor(min)}${suffix}`
    : `Up to ${formatMinor(max)}${suffix}`;
}
