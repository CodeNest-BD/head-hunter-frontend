import { useAuth } from "@/features/auth/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

import { fetchMyRecruiterProfile } from "../api/recruiterProfiles";
import { recruiterKeys } from "../keys";
import type { VerificationStatus } from "../schemas";

export interface VerifiedRecruiterState {
  /** True only for a signed-in recruiter. */
  isRecruiter: boolean;
  /** True once an admin has verified them. False for guests and other roles. */
  isVerified: boolean;
  /** Their status, when they are a recruiter; null otherwise. */
  verificationStatus: VerificationStatus | null;
  /** True while the (recruiter-only) profile fetch is still in flight. */
  isLoading: boolean;
  /** True when the (recruiter-only) profile fetch failed, leaving status
   * unknown — distinct from `verificationStatus === null`, which is also the
   * resting state for a guest or non-recruiter. */
  isError: boolean;
  /** Retries the profile fetch after a failure. */
  refetch: () => void;
}

/**
 * Answers "may this visitor see the live map / submit candidates?" without
 * ever firing a request for guests or non-recruiters — the profile query is
 * enabled only for a signed-in recruiter.
 */
export function useIsVerifiedRecruiter(): VerifiedRecruiterState {
  const { user } = useAuth();
  const isRecruiter = user?.role === "recruiter";

  const profile = useQuery({
    queryKey: recruiterKeys.myProfile,
    queryFn: fetchMyRecruiterProfile,
    enabled: isRecruiter,
    staleTime: 60 * 1000,
  });

  const verificationStatus =
    isRecruiter && profile.data ? profile.data.verificationStatus : null;
  return {
    isRecruiter,
    isVerified: verificationStatus === "verified",
    verificationStatus,
    isLoading: isRecruiter && profile.isLoading,
    isError: isRecruiter && profile.isError,
    refetch: () => void profile.refetch(),
  };
}
