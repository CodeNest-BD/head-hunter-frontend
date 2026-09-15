export const disputeKeys = {
  all: ["disputes"] as const,
  list: (page: number) => ["disputes", "list", page] as const,
  detail: (id: string) => ["disputes", "detail", id] as const,
  adminList: (page: number, status?: string) =>
    ["disputes", "admin", "list", page, status ?? "all"] as const,
  adminDetail: (id: string) => ["disputes", "admin", "detail", id] as const,
};
