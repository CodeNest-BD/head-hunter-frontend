import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/utils";
import type { PublicJobCard } from "../publicSchemas";

// The explore page is public: everyone sees the job grid + hero; only the live
// map is gated behind recruiter verification.
const useIsVerifiedRecruiterMock = vi.fn();
vi.mock("@/features/recruiters", () => ({
  useIsVerifiedRecruiter: () => useIsVerifiedRecruiterMock(),
}));

const usePublicJobsMock = vi.fn();
const usePublicJobStatsMock = vi.fn();
vi.mock("../hooks/usePublicJobs", () => ({
  usePublicJobs: (params: unknown) => usePublicJobsMock(params),
  usePublicJobStats: () => usePublicJobStatsMock(),
}));

const useJobMapMock = vi.fn(() => ({ data: [] }));
vi.mock("../hooks/useJobs", () => ({
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

function samplePublicJob(
  overrides: Partial<PublicJobCard> = {},
): PublicJobCard {
  return {
    id: "job-1",
    title: "Senior Backend Engineer",
    companyName: "Acme Inc.",
    roleCategory: "engineering",
    employmentType: "full_time",
    locationState: "CA",
    locationCity: "San Francisco",
    isRemote: false,
    salaryMinMinor: null,
    salaryMaxMinor: null,
    recruiterFeeMinor: 500_000,
    publishedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

function mockJobs(jobs: PublicJobCard[]): void {
  usePublicJobsMock.mockReturnValue({
    data: {
      data: jobs,
      meta: { page: 1, limit: 12, total: jobs.length, totalPages: 1 },
    },
    isLoading: false,
    isError: false,
  });
}

describe("ExploreJobsView", () => {
  beforeEach(() => {
    useIsVerifiedRecruiterMock.mockReset();
    usePublicJobsMock.mockReset();
    usePublicJobStatsMock.mockReset();
    useJobMapMock.mockReset();
    useJobMapMock.mockReturnValue({ data: [] });
    usePublicJobStatsMock.mockReturnValue({
      data: { openJobs: 1, statesCovered: 1 },
    });
    mockJobs([samplePublicJob()]);
  });

  it("shows the marketing hero and the public job grid to everyone", () => {
    useIsVerifiedRecruiterMock.mockReturnValue({
      isRecruiter: false,
      isVerified: false,
      verificationStatus: null,
    });

    renderWithProviders(<ExploreJobsView />);

    expect(screen.getByText(/Set Your Price/)).toBeInTheDocument();
    expect(screen.getByText("Senior Backend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Acme Inc.")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Job title or company"),
    ).toBeInTheDocument();
    // Public browse endpoint, never the authed jobs endpoint.
    expect(usePublicJobsMock).toHaveBeenCalled();
  });

  it("locks the live map for a guest or unverified recruiter", () => {
    useIsVerifiedRecruiterMock.mockReturnValue({
      isRecruiter: false,
      isVerified: false,
      verificationStatus: null,
    });

    renderWithProviders(<ExploreJobsView />);

    expect(
      screen.getAllByText("The live map is for verified recruiters").length,
    ).toBeGreaterThan(0);
    expect(screen.getByTestId("decorative-map")).toBeInTheDocument();
    expect(screen.queryByTestId("live-map")).not.toBeInTheDocument();
  });

  it("shows the live map for a verified recruiter", () => {
    useIsVerifiedRecruiterMock.mockReturnValue({
      isRecruiter: true,
      isVerified: true,
      verificationStatus: "verified",
    });

    renderWithProviders(<ExploreJobsView />);

    expect(screen.getByTestId("live-map")).toBeInTheDocument();
    expect(
      screen.queryByText("The live map is for verified recruiters"),
    ).not.toBeInTheDocument();
    // The grid is still public, so it shows regardless of verification.
    expect(screen.getByText("Senior Backend Engineer")).toBeInTheDocument();
  });

  it("renders an empty state when no roles match, without crashing", () => {
    useIsVerifiedRecruiterMock.mockReturnValue({
      isRecruiter: false,
      isVerified: false,
      verificationStatus: null,
    });
    mockJobs([]);

    renderWithProviders(<ExploreJobsView />);

    expect(
      screen.getByText("No open roles match these filters"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Senior Backend Engineer"),
    ).not.toBeInTheDocument();
  });
});
