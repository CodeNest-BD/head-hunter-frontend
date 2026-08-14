import type { Role } from "@/features/auth";
import type { Notification } from "../schemas";

/** Types that resolve to the submission both parties share. */
const SUBMISSION_TYPES = new Set([
  "submission_received",
  "submission_status_changed",
  "candidate_passed",
  "candidate_status_changed",
  "interview_proposed",
  "interview_scheduled",
  "interview_canceled",
  "offer_received",
  "offer_accepted",
  "offer_declined",
  "hire_confirmation_requested",
]);

/** Money and dispute events. There is no recruiter equivalent of /company/wallet. */
const WALLET_TYPES = new Set([
  "placement_created",
  "placement_released",
  "dispute_opened",
  "dispute_resolved",
  "payout_sent",
]);

const readId = (
  data: Record<string, unknown> | null,
  key: string,
): string | null => {
  const value = data?.[key];
  return typeof value === "string" ? value : null;
};

/**
 * Where a notification takes you, or null when it takes you nowhere.
 *
 * Returning null rather than a best guess is deliberate: routing to a page the
 * payload cannot address is worse than a row that does not respond. Unknown
 * types return null for the same reason the schema types `type` as a string —
 * the backend adds types, and neither the parse nor the click may break.
 */
export function notificationHref(
  notification: Notification,
  role: Role,
): string | null {
  const { type, data } = notification;

  if (SUBMISSION_TYPES.has(type)) {
    const submissionId = readId(data, "submissionId");
    if (!submissionId) return null;
    // Explicit per-role branches rather than a binary ternary: an admin (or
    // any future non-company, non-recruiter role) must fall through to null
    // rather than silently landing on the recruiter's route.
    if (role === "company") return `/company/inbox/${submissionId}`;
    if (role === "recruiter") return `/recruiter/submissions/${submissionId}`;
    return null;
  }

  if (type === "followed_company_posted_job") {
    const jobId = readId(data, "jobId");
    return role === "recruiter" && jobId ? `/jobs/${jobId}` : null;
  }

  if (type === "subscription_past_due") {
    return role === "recruiter" ? "/recruiter/subscription" : null;
  }

  // Recruiters have no wallet or payouts page today, so these are unroutable
  // for them. That is a real product gap, not an oversight of this map.
  if (WALLET_TYPES.has(type)) {
    return role === "company" ? "/company/wallet" : null;
  }

  return null;
}
