import type { SubmissionListParams } from "./api/submissions";

export const submissionKeys = {
  all: ["submissions"] as const,
  list: (params: SubmissionListParams) =>
    ["submissions", "list", params] as const,
  detail: (id: string) => ["submissions", "detail", id] as const,
  inboxJobs: (page: number, limit: number) =>
    ["submissions", "inbox-jobs", page, limit] as const,
  inboxRecruiters: (jobId: string, page: number, limit: number) =>
    ["submissions", "inbox-recruiters", jobId, page, limit] as const,
};
