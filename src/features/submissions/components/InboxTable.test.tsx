import { screen } from "@testing-library/react";
import { describe, beforeEach, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";
import type { Paginated } from "@/shared/libs/pagination";
import type { Submission } from "../schemas";
import { InboxTable } from "./InboxTable";

const fetchSubmissionsMock = vi.fn();
vi.mock("../api/submissions", () => ({
  fetchSubmissions: (...args: unknown[]) => fetchSubmissionsMock(...args),
  fetchSubmission: vi.fn(),
  createSubmission: vi.fn(),
  updateSubmissionStatus: vi.fn(),
}));

// InboxTable pulls in useJobs to resolve job titles per row; the whole jobs
// barrel is mocked (mirrors Thread.test.tsx's mocks of sibling features) so
// this file never touches the jobs feature's real API client.
const fetchJobsMock = vi.fn();
vi.mock("@/features/jobs", () => ({
  useJobs: (...args: unknown[]) => {
    fetchJobsMock(...args);
    return { data: { data: [{ id: "job-1", title: "Staff Engineer" }] } };
  },
}));

// useMessageUnreadCounts itself runs for real (so the Map-building `select`
// gets exercised) — only its underlying API fetcher is mocked, no network.
const fetchMessageUnreadCountsMock = vi.fn();
vi.mock("@/features/conversations/api/conversations", () => ({
  fetchMessageUnreadCounts: (...args: unknown[]) =>
    fetchMessageUnreadCountsMock(...args),
}));

function submission(overrides: Partial<Submission>): Submission {
  return {
    id: "submission-1",
    jobId: "job-1",
    recruiterProfileId: "recruiter-1",
    recruiter: null,
    status: "submitted",
    note: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

function paginated(data: Submission[]): Paginated<Submission> {
  return {
    data,
    meta: { page: 1, limit: 50, total: data.length, totalPages: 1 },
  };
}

function renderInboxTable() {
  return renderWithProviders(<InboxTable />);
}

describe("InboxTable", () => {
  beforeEach(() => {
    fetchSubmissionsMock.mockReset();
    fetchJobsMock.mockReset();
    fetchMessageUnreadCountsMock.mockReset();
  });

  it("shows an unread badge only on rows that have unread messages", async () => {
    fetchSubmissionsMock.mockResolvedValue(
      paginated([
        submission({ id: "sub-1", jobId: "job-1" }),
        submission({ id: "sub-2", jobId: "job-1" }),
      ]),
    );
    fetchMessageUnreadCountsMock.mockResolvedValue([
      { submissionId: "sub-1", unread: 3 },
    ]);

    renderInboxTable();

    expect(
      await screen.findByLabelText("3 unread messages"),
    ).toBeInTheDocument();
    expect(screen.getAllByLabelText(/unread messages/)).toHaveLength(1);
  });
});
