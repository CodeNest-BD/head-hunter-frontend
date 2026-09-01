import type { Job } from "../schemas";
import type { JobView } from "../components/JobDetailView";

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
