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
// RequireRole uses — mocking the barrel keeps this test independent of the
// Redux store.
vi.mock("@/features/auth", () => ({ useAuth: useAuthMock }));
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
    yearsExperience: null,
    specializations: null,
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
    useAuthMock.mockReturnValue({ user: { role: "company" } });

    const { result } = renderHook(() => useVerificationGate(), { wrapper });

    expect(result.current).toEqual({
      status: undefined,
      isApproved: true,
      isLoading: false,
    });
    expect(fetchMyRecruiterProfileMock).not.toHaveBeenCalled();
  });

  it("approves a verified recruiter", async () => {
    useAuthMock.mockReturnValue({ user: { role: "recruiter" } });
    fetchMyRecruiterProfileMock.mockResolvedValue(
      recruiterProfile("verified"),
    );

    const { result } = renderHook(() => useVerificationGate(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toBe("verified");
    expect(result.current.isApproved).toBe(true);
  });

  it("withholds approval from a pending recruiter", async () => {
    useAuthMock.mockReturnValue({ user: { role: "recruiter" } });
    fetchMyRecruiterProfileMock.mockResolvedValue(recruiterProfile("pending"));

    const { result } = renderHook(() => useVerificationGate(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toBe("pending");
    expect(result.current.isApproved).toBe(false);
  });

  it("withholds approval from a rejected recruiter", async () => {
    useAuthMock.mockReturnValue({ user: { role: "recruiter" } });
    fetchMyRecruiterProfileMock.mockResolvedValue(
      recruiterProfile("rejected"),
    );

    const { result } = renderHook(() => useVerificationGate(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toBe("rejected");
    expect(result.current.isApproved).toBe(false);
  });
});
