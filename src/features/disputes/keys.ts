export const disputeKeys = {
  all: ["disputes"] as const,
  lists: ["disputes", "list"] as const,
  list: (page: number, status?: string, subject?: string) =>
    ["disputes", "list", page, status ?? null, subject ?? null] as const,
  detail: (id: string) => ["disputes", "detail", id] as const,
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
  adminDetail: (id: string) => ["disputes", "admin", "detail", id] as const,
  adminAttentionCount: ["disputes", "admin", "attention-count"] as const,
  eligiblePlacements: (role: string) =>
    ["disputes", "eligible-placements", role] as const,
};
