export const billingKeys = {
  all: ["billing"] as const,
  wallet: ["billing", "wallet"] as const,
  ledger: (page: number) => ["billing", "ledger", page] as const,
  subscription: ["billing", "subscription"] as const,
  recruiterPrice: ["billing", "recruiter-price"] as const,
  minRecruiterFee: ["billing", "min-recruiter-fee"] as const,
  recruiterWallet: ["billing", "recruiter-wallet"] as const,
  payoutAccount: ["billing", "payout-account"] as const,
  payouts: (page: number) => ["billing", "payouts", page] as const,
  recruiterPlacements: (page: number) =>
    ["billing", "recruiter-placements", page] as const,
  companyPlacements: (page: number) =>
    ["billing", "company-placements", page] as const,
};
