import { majorInputToMinor } from "@/shared/utils/money";

import type { JobFormValues } from "../schemas";
import type { JobView } from "../components/JobDetailView";

/** A trimmed optional string field, with blank collapsing to null. */
function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Adapts the create/edit form's live values into the shape the recruiter-facing
 * display reads, so the preview renders through the exact same component as the
 * real job page. Money strings become minor units, blank optionals become null,
 * and a not-yet-entered fee previews as $0 (the view's fee is non-nullable).
 */
export function formValuesToJobView(values: JobFormValues): JobView {
  return {
    title: values.title,
    roleCategory: values.roleCategory,
    employmentType: values.employmentType === "" ? null : values.employmentType,
    locationCity: orNull(values.locationCity),
    locationState: orNull(values.locationState),
    isRemote: values.isRemote,
    salaryMinMinor: majorInputToMinor(values.salaryMin),
    salaryMaxMinor: majorInputToMinor(values.salaryMax),
    salaryRatePeriod: values.salaryRatePeriod,
    recruiterFeeMinor: majorInputToMinor(values.recruiterFee) ?? 0,
    // Drafts are never published, so the preview's "Posted" reads "—".
    publishedAt: null,
    description: orNull(values.description),
  };
}
