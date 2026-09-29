import type { Role } from "@/features/auth";
import {
  adminCompanyPath,
  adminDisputePath,
  adminRecruiterPath,
  companyJobPath,
  disputePath,
  inboxThreadPath,
  jobPath,
  serialNumberSchema,
  type EntityRef,
} from "@/shared/utils/entityPaths";
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
const ADMIN_APPROVAL_ROUTES: Record<
  string,
  { queue: string; detail: (subject: EntityRef) => string }
> = {
  recruiter_awaiting_approval: {
    queue: "/admin/recruiters",
    detail: adminRecruiterPath,
  },
  company_awaiting_approval: {
    queue: "/admin/companies",
    detail: adminCompanyPath,
  },
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
 * The UUID under `<entity>Id` plus the serial under `<entity>SerialNumber`.
 * Rows written before serials existed carry only the UUID; their link still
 * loads and the page swaps it for the serial URL.
 */
const readRef = (
  data: Record<string, unknown> | null,
  idKey: string,
  serialKey: string,
): EntityRef | null => {
  const id = readId(data, idKey);
  if (!id) return null;
  const serial = serialNumberSchema.safeParse(data?.[serialKey]);
  return { id, serialNumber: serial.success ? serial.data : undefined };
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
    const candidate = readRef(data, "candidateId", "candidateSerialNumber");
    if (!candidate) return null;
    // Explicit per-role branches rather than a binary ternary: an admin (or
    // any future non-company, non-recruiter role) must fall through to null
    // rather than silently landing on the recruiter's route.
    if (role === "company") return inboxThreadPath("company", candidate);
    if (role === "recruiter") return inboxThreadPath("recruiter", candidate);
    return null;
  }

  if (type === "followed_company_posted_job") {
    const job = readRef(data, "jobId", "jobSerialNumber");
    return role === "recruiter" && job ? jobPath(job) : null;
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
    const job = readRef(data, "jobId", "jobSerialNumber");
    return role === "company" && job ? companyJobPath(job) : null;
  }

  const approvalRoute = ADMIN_APPROVAL_ROUTES[type];
  if (approvalRoute) {
    if (role !== "admin") return null;
    // Older rows predate `subjectUserId`; the queue still gets them there.
    const subject = readRef(data, "subjectUserId", "subjectSerialNumber");
    return subject ? approvalRoute.detail(subject) : approvalRoute.queue;
  }

  if (DISPUTE_TYPES.has(type)) {
    const dispute = readRef(data, "disputeId", "disputeSerialNumber");
    if (role === "admin") {
      return dispute ? adminDisputePath(dispute) : "/admin/disputes";
    }
    // Company and recruiter share the participant view.
    if (role === "company" || role === "recruiter") {
      return dispute ? disputePath(dispute) : "/disputes";
    }
    return null;
  }

  return null;
}
