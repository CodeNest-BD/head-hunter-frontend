import type { SubmissionListParams } from "./api/submissions";

export const submissionKeys = {
  all: ["submissions"] as const,
  list: (params: SubmissionListParams) =>
    ["submissions", "list", params] as const,
  detail: (id: string) => ["submissions", "detail", id] as const,
  inboxJobs: (params: unknown) =>
    ["submissions", "inbox-jobs", params] as const,
  inboxRecruiters: (jobId: string, params: unknown) =>
    ["submissions", "inbox-recruiters", jobId, params] as const,
};
