import { majorInputToMinor } from "@/shared/utils/money";

import type { Job, JobFormValues } from "../schemas";
import type { JobView } from "../components/JobDetailView";
import { toIntakeInput } from "./jobIntake";

/** A trimmed optional string field, with blank collapsing to null. */
function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * The display's view of the intake fields that live only on authed surfaces.
 * Derived by running the form through the real writer, so the preview can never
 * show a shape a save would not produce.
 */
function intakeToJobViewExtras(
  values: JobFormValues,
): Pick<
  JobView,
  | "worksiteAddress"
  | "daysAndHours"
  | "reportsTo"
  | "benefits"
  | "interviewingAvailability"
  | "postedOnlineElsewhere"
  | "otherSourcing"
> {
  const intake = toIntakeInput(values, null);
  return {
    worksiteAddress: intake?.worksiteAddress,
    daysAndHours: intake?.daysAndHours,
    reportsTo: intake?.reportsTo,
    benefits: intake?.benefits,
    interviewingAvailability: intake?.interviewingAvailability,
    postedOnlineElsewhere: intake?.postedOnlineElsewhere,
    otherSourcing: intake?.otherSourcing,
  };
}

/**
 * Adapts an API job into the display shape: everything already lines up except
 * the intake groups, which the view reads flat rather than nested.
 */
export function jobToJobView(job: Job): JobView {
  return {
    ...job,
    offerTimeline: job.intake?.offerTimeline ?? null,
    mustHave: job.intake?.qualifications?.mustHave ?? [],
    niceToHave: job.intake?.qualifications?.niceToHave ?? [],
    interviewProcess: job.intake?.interviewProcess ?? [],
    worksiteAddress: job.intake?.worksiteAddress,
    daysAndHours: job.intake?.daysAndHours,
    reportsTo: job.intake?.reportsTo,
    benefits: job.intake?.benefits,
    interviewingAvailability: job.intake?.interviewingAvailability,
    postedOnlineElsewhere: job.intake?.postedOnlineElsewhere,
    otherSourcing: job.intake?.otherSourcing,
  };
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
    offerTimeline: values.timelineToHire === "" ? null : values.timelineToHire,
    mustHave: values.mustHave,
    niceToHave: values.niceToHave,
    // Straight through the same writer the save uses, so the preview shows
    // exactly the shape that would be stored.
    ...intakeToJobViewExtras(values),
    // Same renumbering the write path applies, so the preview matches what a
    // save would store.
    interviewProcess: values.interviewRounds.map((round, index) => ({
      order: index + 1,
      type: round.type,
      durationMinutes: Number(round.durationMinutes),
    })),
  };
}
