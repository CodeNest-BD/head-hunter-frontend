import type { PillTone } from "@/shared/ui-components/badges/Pill";

import type {
  AccountStatus,
  AdminCandidateStatus,
  JobStatus,
} from "../schemas";

/**
 * The semantic tone each admin-side status wears. Every map here names one of
 * the reference's seven pill tones, so the admin tables and the participant
 * views can never drift apart on color.
 */
export const ACCOUNT_STATUS_TONES: Record<AccountStatus, PillTone> = {
  active: "ok",
  suspended: "bad",
};

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: "Active",
  suspended: "Suspended",
};

export const SUBSCRIPTION_STATUS_TONES: Record<string, PillTone> = {
  active: "ok",
  past_due: "warn",
  incomplete: "warn",
  canceled: "neutral",
  none: "neutral",
};

export const VERIFICATION_STATUS_TONES: Record<string, PillTone> = {
  verified: "ok",
  pending: "warn",
  rejected: "bad",
};

export const CANDIDATE_STATUS_TONES: Record<AdminCandidateStatus, PillTone> = {
  submitted: "info",
  reviewing: "warn",
  interviewing: "warn",
  offered: "ok",
  hired: "ok",
  passed: "bad",
  unknown: "neutral",
};

export const JOB_STATUS_TONES: Record<JobStatus, PillTone> = {
  published: "ok",
  draft: "neutral",
  paused: "warn",
  filled: "info",
  closed: "neutral",
  expired: "bad",
  unknown: "neutral",
};
