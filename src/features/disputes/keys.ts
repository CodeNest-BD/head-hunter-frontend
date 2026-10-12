import type { DisputeChannel, DisputeStatus } from "./schemas";

/** What narrows the admin dispute inbox. */
export interface AdminDisputeListParams {
  page: number;
  statuses?: readonly DisputeStatus[];
  raisedBy?: DisputeChannel;
  /** Restrict to one company, for the link from its profile. */
  companyProfileId?: string;
  q?: string;
  /** Only cases an admin has not read since the last message. */
  unread?: boolean;
  sort?: string;
}

export const disputeKeys = {
  all: ["disputes"] as const,
  lists: ["disputes", "list"] as const,
  list: (page: number, status?: string, subject?: string) =>
    ["disputes", "list", page, status ?? null, subject ?? null] as const,
  /** Prefix matching every detail, whichever URL ref (serial or UUID) it was read by. */
  details: ["disputes", "detail"] as const,
  detail: (ref: string) => ["disputes", "detail", ref] as const,
  attentionCount: ["disputes", "attention-count"] as const,
  adminLists: ["disputes", "admin", "list"] as const,
  adminSummary: ["disputes", "admin", "summary"] as const,
  adminList: (params: AdminDisputeListParams) =>
    [
      "disputes",
      "admin",
      "list",
      params.page,
      params.statuses?.join(",") ?? "all",
      params.raisedBy ?? "any",
      params.companyProfileId ?? "all-companies",
      params.q ?? "",
      params.unread ? "unread" : "any-read",
      params.sort ?? "needs_action",
    ] as const,
  adminDetails: ["disputes", "admin", "detail"] as const,
  adminDetail: (ref: string) => ["disputes", "admin", "detail", ref] as const,
  adminAttentionCount: ["disputes", "admin", "attention-count"] as const,
  eligiblePlacements: (role: string) =>
    ["disputes", "eligible-placements", role] as const,
};
