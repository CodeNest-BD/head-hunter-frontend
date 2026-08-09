export interface AdminListParams {
  page: number;
  q?: string;
  status?: string;
}

export const adminKeys = {
  all: ["admin"] as const,
  stats: ["admin", "stats"] as const,
  recruiters: (params: AdminListParams) =>
    ["admin", "recruiters", params] as const,
  recruiter: (userId: string) => ["admin", "recruiter", userId] as const,
  companies: (params: AdminListParams) =>
    ["admin", "companies", params] as const,
  company: (userId: string) => ["admin", "company", userId] as const,
  conversations: (params: AdminListParams) =>
    ["admin", "conversations", params] as const,
  conversation: (submissionId: string) =>
    ["admin", "conversation", submissionId] as const,
};
