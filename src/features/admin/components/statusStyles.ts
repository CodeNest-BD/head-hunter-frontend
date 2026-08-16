import type { AccountStatus, JobStatus, SubmissionStatus } from "../schemas";

/** Account status pill colors (matches the app's light status palette). */
export const ACCOUNT_STATUS_STYLES: Record<AccountStatus, string> = {
  active: "bg-[#E7F4EC] text-[#17734E]",
  suspended: "bg-[#FBEAEA] text-[#9B3535]",
};

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: "Active",
  suspended: "Held",
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

export const SUBMISSION_STATUS_STYLES: Record<SubmissionStatus, string> = {
  submitted: "bg-primary/15 text-primary",
  under_review: "bg-[#FBF3DF] text-[#7A5109]",
  advanced: "bg-[#E7F4EC] text-[#17734E]",
  rejected: "bg-[#FBEAEA] text-[#9B3535]",
  withdrawn: "bg-muted text-muted-foreground",
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
