import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/utils";
import type { Job } from "../schemas";

const useVerificationGateMock = vi.fn();
vi.mock("@/features/recruiters", () => ({
  useVerificationGate: () => useVerificationGateMock(),
}));

const useJobsMock = vi.fn();
const useJobMapMock = vi.fn();
vi.mock("../hooks/useJobs", () => ({
  useJobs: (params: unknown) => useJobsMock(params),
  useJobMap: (params: unknown) => useJobMapMock(params),
}));

vi.mock("@/components/landing/DecorativeUsMap", () => ({
  DecorativeUsMap: () => <div data-testid="decorative-map" />,
}));

vi.mock("./UsJobMap", () => ({
  UsJobMap: () => <div data-testid="live-map" />,
}));

// Imported after the mocks so the module graph picks them up.
import { ExploreJobsView } from "./ExploreJobsView";

function sampleJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "job-1",
    title: "Senior Backend Engineer",
    description: null,
    employmentType: "full_time",
    roleCategory: "engineering",
    locationState: "CA",
    locationCity: "San Francisco",
    isRemote: false,
    salaryMinMinor: null,
    salaryMaxMinor: null,
    recruiterFeeMinor: 500_000,
    status: "published",
    publishedAt: new Date("2026-01-01"),
    createdAt: new Date("2026-01-01"),
    companyName: "Acme Inc.",
    ...overrides,
  };
}

describe("ExploreJobsView", () => {
  it("hides the job grid, toolbar and pager, and never fetches jobs, when the visitor is not approved", () => {
    useVerificationGateMock.mockReturnValue({
      isApproved: false,
      status: undefined,
      isLoading: false,
      isError: false,
      retry: vi.fn(),
    });

    renderWithProviders(<ExploreJobsView />);

    expect(
      screen.getByText("Job listings are for verified recruiters"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Senior Backend Engineer"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Acme Inc.")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Job title…")).not.toBeInTheDocument();
    expect(useJobsMock).not.toHaveBeenCalled();
  });

  it("shows a sign-up CTA (not a pending message) for a guest, and a pending message for an unverified recruiter", () => {
    useVerificationGateMock.mockReturnValue({
      isApproved: false,
      status: undefined,
      isLoading: false,
      isError: false,
      retry: vi.fn(),
    });
    const { unmount } = renderWithProviders(<ExploreJobsView />);
    expect(
      screen.getAllByRole("link", { name: "Sign Up as a Recruiter" }).length,
    ).toBeGreaterThan(0);
    unmount();

    useVerificationGateMock.mockReturnValue({
      isApproved: false,
      status: "pending",
      isLoading: false,
      isError: false,
      retry: vi.fn(),
    });
    renderWithProviders(<ExploreJobsView />);
    expect(
      screen.queryByRole("link", { name: "Sign Up as a Recruiter" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByText(/awaiting verification/i).length,
    ).toBeGreaterThan(0);
  });

  it("shows the job grid, toolbar and pager, and fetches via the authed jobs endpoint, once approved", () => {
    useVerificationGateMock.mockReturnValue({
      isApproved: true,
      status: "verified",
      isLoading: false,
      isError: false,
      retry: vi.fn(),
    });
    useJobMapMock.mockReturnValue({ data: [] });
    useJobsMock.mockReturnValue({
      data: {
        data: [sampleJob()],
        meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<ExploreJobsView />);

    expect(screen.getByText("Senior Backend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Acme Inc.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Job title…")).toBeInTheDocument();
    expect(
      screen.queryByText("Job listings are for verified recruiters"),
    ).not.toBeInTheDocument();
    expect(useJobsMock).toHaveBeenCalled();
  });
});
