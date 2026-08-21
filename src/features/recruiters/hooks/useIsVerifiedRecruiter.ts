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
  const { status, user } = useAuth();
  const isRecruiter = user?.role === "recruiter";
  // The user lands in the store before the access token is usable, so firing on
  // the role alone sent this request during boot and got a 401 back.
  const sessionReady = status === "authenticated";

  const profile = useQuery({
    queryKey: recruiterKeys.myProfile,
    queryFn: fetchMyRecruiterProfile,
    enabled: isRecruiter && sessionReady,
    staleTime: 60 * 1000,
  });

  const verificationStatus =
    isRecruiter && profile.data ? profile.data.verificationStatus : null;
  return {
    isRecruiter,
    isVerified: verificationStatus === "verified",
    verificationStatus,
    // A disabled query is pending but not loading, so the booting window has to
    // be reported explicitly — otherwise callers read an undecided gate as a
    // decided "not verified" and flash the locked state at a verified recruiter.
    isLoading: isRecruiter && (!sessionReady || profile.isLoading),
    isError: isRecruiter && profile.isError,
    refetch: () => void profile.refetch(),
  };
}
