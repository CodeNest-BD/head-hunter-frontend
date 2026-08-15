export interface AdminListParams {
  page: number;
  /** Rows per page. Defaults to the API page size when omitted. */
  limit?: number;
  q?: string;
  status?: string;
  /** Restrict a list to one company (its profile id) — used by deep-links. */
  companyProfileId?: string;
  /** Restrict a list to one recruiter (its profile id). */
  recruiterProfileId?: string;
  /** Restrict conversations to one job — used by deep-links. */
  jobId?: string;
  /** Whitelisted sort column id (server maps it to a SQL column). */
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
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
  jobs: (params: AdminListParams) => ["admin", "jobs", params] as const,
  disputes: (params: AdminListParams) => ["admin", "disputes", params] as const,
  pricing: ["admin", "pricing"] as const,
  admins: ["admin", "admins"] as const,
};
