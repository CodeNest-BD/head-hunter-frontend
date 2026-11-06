import type { InboxSide } from "./api/inbox";

export const inboxKeys = {
  all: ["inbox"] as const,
  conversations: (side: InboxSide, params: unknown) =>
    ["inbox", side, "conversations", params] as const,
  jobs: (side: InboxSide, params: unknown) =>
    ["inbox", side, "jobs", params] as const,
  attentionCount: (side: InboxSide) =>
    ["inbox", side, "attention-count"] as const,
  submissions: (params: unknown) =>
    ["inbox", "company", "submissions", params] as const,
  submissionStats: (jobId: string | undefined) =>
    ["inbox", "company", "submission-stats", jobId] as const,
};
