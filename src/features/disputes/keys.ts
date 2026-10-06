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
  adminList: (page: number, statuses?: readonly string[], raisedBy?: string) =>
    [
      "disputes",
      "admin",
      "list",
      page,
      statuses?.join(",") ?? "all",
      raisedBy ?? "any",
    ] as const,
  adminDetails: ["disputes", "admin", "detail"] as const,
  adminDetail: (ref: string) => ["disputes", "admin", "detail", ref] as const,
  adminAttentionCount: ["disputes", "admin", "attention-count"] as const,
  eligiblePlacements: (role: string) =>
    ["disputes", "eligible-placements", role] as const,
};
