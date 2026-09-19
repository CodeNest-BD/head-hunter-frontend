export const disputeKeys = {
  all: ["disputes"] as const,
  list: (page: number) => ["disputes", "list", page] as const,
  detail: (id: string) => ["disputes", "detail", id] as const,
  attentionCount: ["disputes", "attention-count"] as const,
  adminList: (page: number, status?: string, raisedBy?: string) =>
    [
      "disputes",
      "admin",
      "list",
      page,
      status ?? "all",
      raisedBy ?? "any",
    ] as const,
  adminDetail: (id: string) => ["disputes", "admin", "detail", id] as const,
  eligiblePlacements: (role: string) =>
    ["disputes", "eligible-placements", role] as const,
};
