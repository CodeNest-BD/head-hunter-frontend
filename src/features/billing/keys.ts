export const billingKeys = {
  all: ["billing"] as const,
  wallet: ["billing", "wallet"] as const,
  ledger: (page: number) => ["billing", "ledger", page] as const,
  subscription: ["billing", "subscription"] as const,
  recruiterPrice: ["billing", "recruiter-price"] as const,
  recruiterWallet: ["billing", "recruiter-wallet"] as const,
  recruiterPlacements: (page: number) =>
    ["billing", "recruiter-placements", page] as const,
};
