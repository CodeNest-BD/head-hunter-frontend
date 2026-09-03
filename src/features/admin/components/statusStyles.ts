import type {
  AccountStatus,
  AdminCandidateStatus,
  JobStatus,
} from "../schemas";

/** Account status pill colors (matches the app's light status palette). */
export const ACCOUNT_STATUS_STYLES: Record<AccountStatus, string> = {
  active: "bg-[#E7F4EC] text-[#17734E]",
  suspended: "bg-[#FBEAEA] text-[#9B3535]",
};

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: "Active",
  suspended: "Suspended",
};

export const SUBSCRIPTION_STATUS_STYLES: Record<string, string> = {
  active: "bg-[#E7F4EC] text-[#17734E]",
  past_due: "bg-[#FBF3DF] text-[#7A5109]",
  incomplete: "bg-[#FBF3DF] text-[#7A5109]",
  canceled: "bg-muted text-muted-foreground",
  none: "bg-muted text-muted-foreground",
};

export const VERIFICATION_STATUS_STYLES: Record<string, string> = {
  verified: "bg-[#E7F4EC] text-[#17734E]",
  pending: "bg-[#FBF3DF] text-[#7A5109]",
  rejected: "bg-[#FBEAEA] text-[#9B3535]",
};

export const CANDIDATE_STATUS_STYLES: Record<AdminCandidateStatus, string> = {
  submitted: "bg-primary/15 text-primary",
  reviewing: "bg-[#FBF3DF] text-[#7A5109]",
  interviewing: "bg-[#FBF3DF] text-[#7A5109]",
  offered: "bg-[#E7F4EC] text-[#17734E]",
  hired: "bg-[#E7F4EC] text-[#17734E]",
  passed: "bg-[#FBEAEA] text-[#9B3535]",
  unknown: "bg-muted text-muted-foreground",
};

export const JOB_STATUS_STYLES: Record<JobStatus, string> = {
  published: "bg-[#E7F4EC] text-[#17734E]",
  draft: "bg-muted text-muted-foreground",
  paused: "bg-[#FBF3DF] text-[#7A5109]",
  filled: "bg-primary/15 text-primary",
  closed: "bg-[#FBEAEA] text-[#9B3535]",
  expired: "bg-[#FBF3DF] text-[#7A5109]",
  unknown: "bg-muted text-muted-foreground",
};
