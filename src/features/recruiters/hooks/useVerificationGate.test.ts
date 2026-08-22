import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RecruiterProfile, VerificationStatus } from "../schemas";

const { useAuthMock, fetchMyRecruiterProfileMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  fetchMyRecruiterProfileMock: vi.fn(),
}));

// The hook's session source (via useIsVerifiedRecruiter) is the same one
// RequireRole uses — mocking the concrete hook module (not the auth barrel)
// keeps this test independent of the Redux store and avoids re-introducing
// the auth <-> recruiters barrel cycle.
vi.mock("@/features/auth/hooks/useAuth", () => ({ useAuth: useAuthMock }));
vi.mock("../api/recruiterProfiles", () => ({
  fetchMyRecruiterProfile: fetchMyRecruiterProfileMock,
}));

// Imported after the mocks so the hook graph picks them up.
import { useVerificationGate } from "./useVerificationGate";

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

function recruiterProfile(status: VerificationStatus): RecruiterProfile {
  return {
    id: "profile-1",
    addressLine: null,
    city: null,
    state: null,
    zip: null,
    linkedinUrl: null,
    phone: null,
    phoneVerified: false,
    experiences: [],
    yearsExperience: null,
    specializations: [],
    subscriptionStatus: "none",
    verificationStatus: status,
    verificationNote: null,
    ratingAvg: null,
    ratingCount: 0,
    hasMarketplaceAccess: status === "verified",
    references: [],
  };
}

describe("useVerificationGate", () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    fetchMyRecruiterProfileMock.mockReset();
  });

  it("approves a non-recruiter without ever fetching a recruiter profile", () => {
    useAuthMock.mockReturnValue({
      status: "authenticated",
      user: { role: "company" },
    });

    const { result } = renderHook(() => useVerificationGate(), { wrapper });

    expect(result.current).toEqual({
      status: undefined,
      isApproved: true,
      isLoading: false,
      isError: false,
      retry: expect.any(Function),
    });
    expect(fetchMyRecruiterProfileMock).not.toHaveBeenCalled();
  });

  it("approves a verified recruiter", async () => {
    useAuthMock.mockReturnValue({
      status: "authenticated",
      user: { role: "recruiter" },
    });
    fetchMyRecruiterProfileMock.mockResolvedValue(recruiterProfile("verified"));

    const { result } = renderHook(() => useVerificationGate(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toBe("verified");
    expect(result.current.isApproved).toBe(true);
    expect(result.current.isError).toBe(false);
  });

  it("withholds approval from a pending recruiter", async () => {
    useAuthMock.mockReturnValue({
      status: "authenticated",
      user: { role: "recruiter" },
    });
    fetchMyRecruiterProfileMock.mockResolvedValue(recruiterProfile("pending"));

    const { result } = renderHook(() => useVerificationGate(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toBe("pending");
    expect(result.current.isApproved).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("withholds approval from a rejected recruiter", async () => {
    useAuthMock.mockReturnValue({
      status: "authenticated",
      user: { role: "recruiter" },
    });
    fetchMyRecruiterProfileMock.mockResolvedValue(recruiterProfile("rejected"));

    const { result } = renderHook(() => useVerificationGate(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toBe("rejected");
    expect(result.current.isApproved).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("surfaces a failed profile fetch as isError, distinct from a decided status", async () => {
    useAuthMock.mockReturnValue({
      status: "authenticated",
      user: { role: "recruiter" },
    });
    fetchMyRecruiterProfileMock.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useVerificationGate(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toBeUndefined();
    expect(result.current.isApproved).toBe(false);
    expect(result.current.isError).toBe(true);
  });

  it("withholds approval while the session is booting, even though nobody looks like a recruiter yet", () => {
    // The 401 this guards: `isApproved` was `!isRecruiter || isVerified`, and
    // during boot the store has no user — so every visitor read as an approved
    // non-recruiter and callers fired the authed marketplace queries with no
    // token.
    useAuthMock.mockReturnValue({ status: "booting", user: null });

    const { result } = renderHook(() => useVerificationGate(), { wrapper });

    expect(result.current.isApproved).toBe(false);
    expect(result.current.isLoading).toBe(true);
    expect(fetchMyRecruiterProfileMock).not.toHaveBeenCalled();
  });

  it("approves a non-recruiter once the session has settled", () => {
    useAuthMock.mockReturnValue({
      status: "authenticated",
      user: { role: "company" },
    });

    const { result } = renderHook(() => useVerificationGate(), { wrapper });

    expect(result.current.isApproved).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it("reports approval as undecided while the session is still booting", async () => {
    // The regression this guards: the profile request fired on the role alone,
    // 401'd during boot, and the undecided gate read as a decided "not
    // verified" — flashing the locked marketplace at a verified recruiter.
    useAuthMock.mockReturnValue({
      status: "booting",
      user: { role: "recruiter" },
    });

    const { result } = renderHook(() => useVerificationGate(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isApproved).toBe(false);
    expect(fetchMyRecruiterProfileMock).not.toHaveBeenCalled();
  });
});
