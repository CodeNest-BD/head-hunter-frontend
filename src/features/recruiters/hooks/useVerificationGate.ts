import { useIsVerifiedRecruiter } from "./useIsVerifiedRecruiter";
import type { VerificationStatus } from "../schemas";

export interface VerificationGateState {
  /** The recruiter's server-reported status; undefined for non-recruiters. */
  status: VerificationStatus | undefined;
  /** True for every non-recruiter, and for a recruiter once verified. */
  isApproved: boolean;
  isLoading: boolean;
}

/**
 * One source of truth for "may this recruiter use the marketplace". Reads the
 * server's verification status (via `useIsVerifiedRecruiter`, which already
 * reuses the app's session hook) rather than inferring it, so the UI cannot
 * drift from what the API enforces. Companies and admins are never gated.
 */
export function useVerificationGate(): VerificationGateState {
  const { isRecruiter, isVerified, verificationStatus, isLoading } =
    useIsVerifiedRecruiter();

  return {
    status: verificationStatus ?? undefined,
    isApproved: !isRecruiter || isVerified,
    isLoading,
  };
}
