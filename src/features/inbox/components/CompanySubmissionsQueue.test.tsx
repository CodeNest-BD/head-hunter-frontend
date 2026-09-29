import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
    candidateSerialNumber: 7,
    candidateName: "Sarah Ahmed",
    status: "submitted",
    jobId: "job-1",
    jobSerialNumber: 22,
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
          jobSerialNumber: 22,
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
  beforeAll(() => {
    // Radix Popover uses these; jsdom doesn't implement them.
    Element.prototype.scrollIntoView = vi.fn();
    Element.prototype.hasPointerCapture = vi.fn();
  });

  beforeEach(() => {
    submissionsMock.mockClear();
    pushMock.mockClear();
  });

  it("renders read-only stat cards from the current statuses and defaults to priority sort", () => {
    renderWithProviders(<CompanySubmissionsQueue />);

    expect(screen.getByText("Total Submissions")).toBeInTheDocument();
    expect(screen.getByText("238")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument(); // New
    expect(screen.getByText("120")).toBeInTheDocument(); // Reviewing
    // Cards are informational — not clickable filters.
    expect(
      screen.queryByRole("button", { name: /Reviewing/ }),
    ).not.toBeInTheDocument();
    expect(submissionsMock).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: "priority", status: undefined }),
    );
  });

  it("filters by status from the status column header", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompanySubmissionsQueue />);

    await user.click(screen.getByRole("button", { name: "Filter by Status" }));
    // Scope to the popover option (the label and badge also read "Reviewing").
    await user.click(screen.getByRole("button", { name: "Reviewing" }));

    expect(submissionsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "reviewing", page: 1 }),
    );
  });

  it("passes the recruiter-kind filter from the recruiter column header", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompanySubmissionsQueue />);

    await user.click(
      screen.getByRole("button", { name: "Filter by Recruiter" }),
    );
    await user.click(screen.getByText("Unrated recruiters"));

    expect(submissionsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ recruiterKind: "unrated" }),
    );
  });

  it("shows rating with review count, and the new-recruiter fallback", () => {
    renderWithProviders(<CompanySubmissionsQueue />);

    expect(screen.getAllByText("5.0").length).toBeGreaterThan(0);
    expect(screen.getAllByText("(24)").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no reviews yet/i).length).toBeGreaterThan(0);
  });

  it("links the job cell to the job detail page", () => {
    renderWithProviders(<CompanySubmissionsQueue />);

    const jobLinks = screen.getAllByRole("link", { name: /Product Designer/ });
    expect(jobLinks[0]).toHaveAttribute("href", "/jobs/22");
  });

  it("scopes the list by the job's serial from the job column header", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompanySubmissionsQueue />);

    await user.click(screen.getByRole("button", { name: "Filter by Job" }));
    await user.click(
      screen.getByRole("button", { name: "Product Designer (12 new)" }),
    );

    expect(submissionsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ jobId: "22", page: 1 }),
    );
  });

  it("opens the conversation from the row and the View link", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompanySubmissionsQueue />);

    await user.click(screen.getAllByText("Sarah Ahmed")[0]);
    expect(pushMock).toHaveBeenCalledWith("/company/inbox/7");

    const viewLinks = screen.getAllByRole("link", { name: "View" });
    expect(viewLinks[0]).toHaveAttribute("href", "/company/inbox/7");
  });
});
