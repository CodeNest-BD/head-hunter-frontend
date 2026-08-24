import type { InboxSide } from "./api/inbox";

export const inboxKeys = {
  all: ["inbox"] as const,
  jobs: (side: InboxSide, params: unknown) =>
    ["inbox", side, "jobs", params] as const,
  candidates: (side: InboxSide, jobId: string, params: unknown) =>
    ["inbox", side, "candidates", jobId, params] as const,
};
