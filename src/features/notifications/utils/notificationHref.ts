import type { Role } from "@/features/auth";
import type { Notification } from "../schemas";

/** Types that resolve to the candidate thread both parties share. */
const CANDIDATE_TYPES = new Set([
  "submission_received",
  "candidate_passed",
  "candidate_status_changed",
  "interview_proposed",
  "interview_scheduled",
  "interview_canceled",
  "offer_received",
  "offer_accepted",
  "offer_declined",
  "hire_confirmation_requested",
  "submission_status_changed",
]);

/** Money events — each role's own wallet page. */
const WALLET_TYPES = new Set([
  "placement_created",
  "placement_released",
  "payout_sent",
  "payout_failed",
]);

/** Account events — the verification status lives on each role's profile. */
const PROFILE_TYPES = new Set([
  "verification_approved",
  "verification_rejected",
]);

/** Admin approval queue — the account's admin detail page. */
const ADMIN_APPROVAL_ROUTES: Record<string, string> = {
  recruiter_awaiting_approval: "/admin/recruiters",
  company_awaiting_approval: "/admin/companies",
};

/** Dispute events route to the ticket — the admin's or the participant's view. */
const DISPUTE_TYPES = new Set([
  "dispute_opened",
  "dispute_resolved",
  "dispute_message",
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

  if (CANDIDATE_TYPES.has(type)) {
    const candidateId = readId(data, "candidateId");
    if (!candidateId) return null;
    // Explicit per-role branches rather than a binary ternary: an admin (or
    // any future non-company, non-recruiter role) must fall through to null
    // rather than silently landing on the recruiter's route.
    if (role === "company") return `/company/inbox/${candidateId}`;
    if (role === "recruiter") return `/recruiter/inbox/${candidateId}`;
    return null;
  }

  if (type === "followed_company_posted_job") {
    const jobId = readId(data, "jobId");
    return role === "recruiter" && jobId ? `/jobs/${jobId}` : null;
  }

  if (type === "subscription_past_due") {
    return role === "recruiter" ? "/recruiter/subscription" : null;
  }

  if (WALLET_TYPES.has(type)) {
    if (role === "company") return "/company/wallet";
    if (role === "recruiter") return "/recruiter/wallet";
    return null;
  }

  if (PROFILE_TYPES.has(type)) {
    if (role === "company") return "/company/profile";
    if (role === "recruiter") return "/recruiter/profile";
    return null;
  }

  if (type === "job_expired") {
    const jobId = readId(data, "jobId");
    return role === "company" && jobId ? `/company/jobs/${jobId}` : null;
  }

  const approvalRoute = ADMIN_APPROVAL_ROUTES[type];
  if (approvalRoute) {
    if (role !== "admin") return null;
    // Older rows predate `subjectUserId`; the queue still gets them there.
    const userId = readId(data, "subjectUserId");
    return userId ? `${approvalRoute}/${userId}` : approvalRoute;
  }

  if (DISPUTE_TYPES.has(type)) {
    const disputeId = readId(data, "disputeId");
    if (role === "admin") {
      return disputeId ? `/admin/disputes/${disputeId}` : "/admin/disputes";
    }
    // Company and recruiter share the participant view.
    if (role === "company" || role === "recruiter") {
      return disputeId ? `/disputes/${disputeId}` : "/disputes";
    }
    return null;
  }

  return null;
}
