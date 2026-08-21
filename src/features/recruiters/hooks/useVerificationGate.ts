import { useIsVerifiedRecruiter } from "./useIsVerifiedRecruiter";
import type { VerificationStatus } from "../schemas";

export interface VerificationGateState {
  /** The recruiter's server-reported status; undefined for non-recruiters. */
  status: VerificationStatus | undefined;
  /** True for every non-recruiter, and for a recruiter once verified. */
  isApproved: boolean;
  isLoading: boolean;
  /** True when the profile fetch failed, leaving approval undecidable —
   * distinct from `!isApproved`, which means the server answered "not yet". */
  isError: boolean;
  /** Retries the profile fetch after a failure. */
  retry: () => void;
}

/**
 * One source of truth for "may this recruiter use the marketplace". Reads the
 * server's verification status (via `useIsVerifiedRecruiter`, which already
 * reuses the app's session hook) rather than inferring it, so the UI cannot
 * drift from what the API enforces. Companies and admins are never gated.
 */
export function useVerificationGate(): VerificationGateState {
  const {
    isRecruiter,
    isVerified,
    verificationStatus,
    isLoading,
    isError,
    refetch,
  } = useIsVerifiedRecruiter();

  return {
    status: verificationStatus ?? undefined,
    // Fails closed while undecided. Approving non-recruiters is right once the
    // session is known, but during boot nobody looks like a recruiter, so this
    // used to approve everyone — including visitors with no token at all.
    isApproved: !isLoading && (!isRecruiter || isVerified),
    isLoading,
    isError,
    retry: refetch,
  };
}
