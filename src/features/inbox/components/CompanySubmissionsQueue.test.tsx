import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/utils";
import type { InboxSubmissionRow } from "../schemas";
import { CompanySubmissionsQueue } from "./CompanySubmissionsQueue";

const pushMock = vi.fn();
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ push: pushMock, replace: vi.fn(), prefetch: vi.fn() }),
}));

const submissionsMock = vi.fn();

function row(overrides: Partial<InboxSubmissionRow>): InboxSubmissionRow {
  return {
    candidateId: "cand-1",
    candidateName: "Sarah Ahmed",
    status: "submitted",
    jobId: "job-1",
    jobTitle: "Product Designer",
    submittedAt: new Date(Date.now() - 10 * 60_000),
    unreadMessages: 0,
    needsReview: false,
    recruiter: {
      id: "rec-1",
      firstName: "John",
      lastName: "Carter",
      yearsExperience: 8,
      specializations: null,
      ratingAvg: 5,
      ratingCount: 24,
    },
    ...overrides,
  };
}

const ROWS = [
  row({}),
  row({
    candidateId: "cand-2",
    candidateName: "Noah Fresh",
    status: "reviewing",
    needsReview: true,
    recruiter: {
      id: "rec-2",
      firstName: "Nina",
      lastName: "New",
      yearsExperience: null,
      specializations: null,
      ratingAvg: null,
      ratingCount: 0,
    },
  }),
];

vi.mock("../hooks/useInbox", () => ({
  useCompanySubmissions: (params: unknown) => {
    submissionsMock(params);
    return {
      data: {
        data: ROWS,
        meta: { total: 2, totalPages: 1, page: 1, limit: 25 },
      },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    };
  },
  useCompanySubmissionStats: () => ({
    data: {
      total: 238,
      submitted: 42,
      reviewing: 120,
      interviewing: 54,
      offered: 12,
      hired: 8,
      passed: 2,
    },
  }),
  useInboxJobs: () => ({
    data: {
      data: [
        {
          jobId: "job-1",
          jobTitle: "Product Designer",
          jobStatus: "published",
          candidateCount: 20,
          newCandidateCount: 12,
          unreadMessages: 0,
          lastCandidateAt: new Date(),
        },
      ],
      meta: { total: 1, totalPages: 1, page: 1, limit: 100 },
    },
  }),
}));

describe("CompanySubmissionsQueue", () => {
  beforeEach(() => {
    submissionsMock.mockClear();
    pushMock.mockClear();
  });

  it("renders stat cards from the current statuses and defaults to priority sort", () => {
    renderWithProviders(<CompanySubmissionsQueue />);

    expect(screen.getByText("Total Submissions")).toBeInTheDocument();
    expect(screen.getByText("238")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument(); // New
    expect(screen.getByText("120")).toBeInTheDocument(); // Reviewing
    expect(screen.getByText("2 submissions found")).toBeInTheDocument();
    expect(submissionsMock).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: "priority", status: undefined }),
    );
  });

  it("filters by status when a stat card is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompanySubmissionsQueue />);

    await user.click(screen.getByRole("button", { name: /New 42/ }));

    expect(submissionsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "submitted", page: 1 }),
    );
  });

  it("shows rating with review count, and the new-recruiter fallback", () => {
    renderWithProviders(<CompanySubmissionsQueue />);

    // Rated recruiter: value + review count. (Desktop table and mobile cards
    // both render in jsdom, so text queries match twice.)
    expect(screen.getAllByText("5.0").length).toBeGreaterThan(0);
    expect(screen.getAllByText("(24)").length).toBeGreaterThan(0);
    // Unrated recruiter: named fallback, never a zero.
    expect(screen.getAllByText(/no reviews yet/i).length).toBeGreaterThan(0);
  });

  it("opens the conversation from the row and the View link", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompanySubmissionsQueue />);

    await user.click(screen.getAllByText("Sarah Ahmed")[0]);
    expect(pushMock).toHaveBeenCalledWith("/company/inbox/cand-1");

    const viewLinks = screen.getAllByRole("link", { name: "View" });
    expect(viewLinks[0]).toHaveAttribute("href", "/company/inbox/cand-1");
  });

  it("passes the recruiter-kind filter through", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompanySubmissionsQueue />);

    await user.selectOptions(
      screen.getByLabelText("Filter by recruiter rating"),
      "unrated",
    );

    expect(submissionsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ recruiterKind: "unrated" }),
    );
  });
});
