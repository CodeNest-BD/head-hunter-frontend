export interface AdminListParams {
  page: number;
  /** Rows per page. Defaults to the API page size when omitted. */
  limit?: number;
  q?: string;
  status?: string;
  /** Recruiter verification filter (pending queue, etc.). */
  verificationStatus?: string;
  /** Recruiter rating band — "high" | "low" | "unrated". */
  rating?: string;
  /** Two-letter US state code the recruiter directory filters on. */
  state?: string;
  /** Company wallet state — "funded" | "empty". */
  wallet?: string;
  /** Company industry, matched exactly against the stored free text. */
  industry?: string;
  /** Jobs board: keep only jobs that reached this hiring stage. */
  activity?: string;
  /** Submissions board: restrict to one job. */
  jobId?: string;
  /** Submissions board: only submissions from the last N days. */
  withinDays?: number;
  /** Submissions board: "newest" (admin view) or "ranking" (company order). */
  order?: string;
  /** Restrict a list to one company (its serial, or profile id) — used by deep-links. */
  company?: string;
  /** Restrict a list to one recruiter (its profile id). */
  recruiterProfileId?: string;
  /**
   * Restrict a list to one company by profile id. Distinct from `company`,
   * which the jobs board accepts as either a serial or an id — conversations
   * and disputes key on the profile id alone.
   */
  companyProfileId?: string;
}

/** What narrows the offers board. */
export interface AdminOfferListParams {
  page: number;
  limit: number;
  q?: string;
  status?: string;
}

export const adminKeys = {
  all: ["admin"] as const,
  stats: ["admin", "stats"] as const,
  recruiters: (params: AdminListParams) =>
    ["admin", "recruiters", params] as const,
  /** Prefix matching every recruiter detail, whichever URL ref it was read by. */
  recruiterDetails: ["admin", "recruiter"] as const,
  recruiter: (ref: string) => ["admin", "recruiter", ref] as const,
  companyIndustries: ["admin", "company-industries"] as const,
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
  /** Prefix matching every job detail, whichever URL ref it was read by. */
  jobDetails: ["admin", "job"] as const,
  job: (ref: string) => ["admin", "job", ref] as const,
  placementCounts: ["admin", "placement-counts"] as const,
  placements: (view: string, page: number, limit: number) =>
    ["admin", "placements", view, page, limit] as const,
  offers: (params: AdminOfferListParams) =>
    ["admin", "offers", params] as const,
  pricing: ["admin", "pricing"] as const,
  dashboard: ["admin", "dashboard"] as const,
  minRecruiterFee: ["admin", "min-recruiter-fee"] as const,
  admins: ["admin", "admins"] as const,

  /* Finance boards. */
  paymentsSummary: ["admin", "payments-summary"] as const,
  payments: (params: AdminPaymentParams) =>
    ["admin", "payments", params] as const,
  paymentCounts: (params: AdminPaymentParams) =>
    ["admin", "payment-counts", params] as const,
  payoutsSummary: ["admin", "payouts-summary"] as const,
  /** Prefix matching every payouts-list page — what a hold invalidates. */
  payoutsAll: ["admin", "payouts"] as const,
  payouts: (params: AdminPayoutParams) => ["admin", "payouts", params] as const,
  /** Prefix matching every payout detail, whichever ref it was read by. */
  payoutDetails: ["admin", "payout"] as const,
  payout: (ref: string) => ["admin", "payout", ref] as const,
};

/** Company payments board filters. The tab is `view`; the rest narrow it. */
export interface AdminPaymentParams {
  page: number;
  limit?: number;
  view?: string;
  q?: string;
  companyProfileId?: string;
  status?: string;
  linkedTo?: string;
}

/** Recruiter payouts board filters. */
export interface AdminPayoutParams {
  page: number;
  limit?: number;
  view?: string;
  q?: string;
  recruiterProfileId?: string;
  companyProfileId?: string;
  holdKind?: string;
  sort?: string;
  sortOrder?: string;
}
