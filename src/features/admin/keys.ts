export interface AdminListParams {
  page: number;
  /** Rows per page. Defaults to the API page size when omitted. */
  limit?: number;
  q?: string;
  status?: string;
  /** Recruiter verification filter (pending queue, etc.). */
  verificationStatus?: string;
  /** Restrict a list to one company (its serial, or profile id) — used by deep-links. */
  company?: string;
  /** Restrict a list to one recruiter (its profile id). */
  recruiterProfileId?: string;
}

export const adminKeys = {
  all: ["admin"] as const,
  stats: ["admin", "stats"] as const,
  recruiters: (params: AdminListParams) =>
    ["admin", "recruiters", params] as const,
  /** Prefix matching every recruiter detail, whichever URL ref it was read by. */
  recruiterDetails: ["admin", "recruiter"] as const,
  recruiter: (ref: string) => ["admin", "recruiter", ref] as const,
  companies: (params: AdminListParams) =>
    ["admin", "companies", params] as const,
  /** Prefix matching every company detail, whichever URL ref it was read by. */
  companyDetails: ["admin", "company"] as const,
  company: (ref: string) => ["admin", "company", ref] as const,
  conversations: (params: AdminListParams) =>
    ["admin", "conversations", params] as const,
  conversation: (candidateId: string) =>
    ["admin", "conversation", candidateId] as const,
  /** Prefix matching every jobs-list page — what job mutations invalidate. */
  jobsAll: ["admin", "jobs"] as const,
  jobs: (params: AdminListParams) => ["admin", "jobs", params] as const,
  pricing: ["admin", "pricing"] as const,
  minRecruiterFee: ["admin", "min-recruiter-fee"] as const,
  admins: ["admin", "admins"] as const,
};
