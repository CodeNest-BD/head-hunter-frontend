export const billingKeys = {
  all: ["billing"] as const,
  wallet: ["billing", "wallet"] as const,
  ledger: (page: number) => ["billing", "ledger", page] as const,
  subscription: ["billing", "subscription"] as const,
  recruiterPrice: ["billing", "recruiter-price"] as const,
  recruiterWallet: ["billing", "recruiter-wallet"] as const,
  recruiterPlacements: (params: {
    page: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => ["billing", "recruiter-placements", params] as const,
};
