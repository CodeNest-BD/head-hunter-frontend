export interface AdminListParams {
  page: number;
  /** Rows per page. Defaults to the API page size when omitted. */
  limit?: number;
  q?: string;
  status?: string;
  /** Recruiter verification filter (pending queue, etc.). */
  verificationStatus?: string;
  /** Restrict a list to one company (its profile id) — used by deep-links. */
  companyProfileId?: string;
  /** Restrict a list to one recruiter (its profile id). */
  recruiterProfileId?: string;
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
  conversation: (candidateId: string) =>
    ["admin", "conversation", candidateId] as const,
  jobs: (params: AdminListParams) => ["admin", "jobs", params] as const,
  pricing: ["admin", "pricing"] as const,
  minRecruiterFee: ["admin", "min-recruiter-fee"] as const,
  admins: ["admin", "admins"] as const,
};
