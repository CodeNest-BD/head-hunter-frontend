import { useAuth } from "@/features/auth/hooks/useAuth";

import { useMyCompanyProfile } from "./useCompanyProfile";
import type { VerificationStatus } from "../schemas";

export interface CompanyApprovalGateState {
  /** The company's server-reported status; undefined for every other role. */
  status: VerificationStatus | undefined;
  /** The admin's note on the latest decision, when they left one. */
  note: string | null;
  /** True for every non-company, and for a company once approved. */
  isApproved: boolean;
  isLoading: boolean;
  /** True when the profile fetch failed, leaving approval undecidable —
   * distinct from `!isApproved`, which means the server answered "not yet". */
  isError: boolean;
  retry: () => void;
}

/**
 * One source of truth for "may this company use the marketplace". The mirror of
 * `useVerificationGate` on the recruiter side, reading `hasMarketplaceAccess`
 * straight off the profile rather than re-deriving it, so the UI cannot drift
 * from what the API enforces.
 */
export function useCompanyApprovalGate(): CompanyApprovalGateState {
  const { status: sessionStatus, user } = useAuth();
  const isCompany = user?.role === "company";
  const sessionReady = sessionStatus === "authenticated";
  const profile = useMyCompanyProfile();

  // Fails closed while undecided: during boot nobody looks like a company, and
  // approving every non-company then would approve visitors with no token.
  const isLoading = isCompany && sessionReady && profile.isPending;

  return {
    status: isCompany ? profile.data?.verificationStatus : undefined,
    note: profile.data?.verificationNote ?? null,
    isApproved:
      sessionReady &&
      !isLoading &&
      (!isCompany || !!profile.data?.hasMarketplaceAccess),
    isLoading: !sessionReady || isLoading,
    isError: isCompany && profile.isError,
    retry: () => void profile.refetch(),
  };
}
