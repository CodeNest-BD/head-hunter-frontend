import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/utils";
import type { Candidate } from "../schemas";
import { ReviewStateNotice } from "./ReviewStateNotice";

const resubmitMock = vi.fn();
vi.mock("../hooks/useCandidates", () => ({
  useResubmitCandidate: () => ({ mutate: resubmitMock, isPending: false }),
}));

function candidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: "cand-1",
    jobId: "job-1",
    recruiterProfileId: "rec-1",
    fullName: "Ada Lovelace",
    email: null,
    phone: null,
    overview: null,
    pitch: null,
    linkedinUrl: null,
    yearsOfExperience: null,
    currentCompany: null,
    expectedSalaryMinor: null,
    noticePeriodDays: null,
    status: "pending_review",
    reviewNote: null,
    reviewedAt: null,
    createdAt: new Date("2026-11-01"),
    ...overrides,
  };
}

describe("ReviewStateNotice", () => {
  beforeEach(() => resubmitMock.mockReset());

  it("says a pending submission is waiting on a quality check", () => {
    renderWithProviders(<ReviewStateNotice candidate={candidate()} />);

    expect(screen.getByText(/waiting on a quality check/i)).toBeInTheDocument();
    // No resubmit on a candidate nobody has decided about yet.
    expect(
      screen.queryByRole("button", { name: /resubmit for review/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the admin's reason, which is the only thing that says what to fix", () => {
    renderWithProviders(
      <ReviewStateNotice
        candidate={candidate({
          status: "declined",
          reviewNote: "The CV is for a different role.",
        })}
      />,
    );

    expect(
      screen.getByText("The CV is for a different role."),
    ).toBeInTheDocument();
  });

  it("still says what to do when a rejection carries no note", () => {
    // The note is optional, so this is the common case rather than the edge.
    renderWithProviders(
      <ReviewStateNotice candidate={candidate({ status: "declined" })} />,
    );

    expect(screen.getByText(/no note was left/i)).toBeInTheDocument();
    expect(screen.queryByText(/what to fix/i)).not.toBeInTheDocument();
    // Still recoverable: a rejection with no note is not a dead end.
    expect(
      screen.getByRole("button", { name: /resubmit for review/i }),
    ).toBeInTheDocument();
  });

  it("heads the notice with the same word the admin's button used", () => {
    renderWithProviders(
      <ReviewStateNotice candidate={candidate({ status: "declined" })} />,
    );

    expect(screen.getByText(/rejected by an admin/i)).toBeInTheDocument();
  });

  it("sets the admin's note apart as a quote, under its own heading", () => {
    const { container } = renderWithProviders(
      <ReviewStateNotice
        candidate={candidate({
          status: "declined",
          reviewNote: "Line one.\nLine two.",
        })}
      />,
    );

    expect(screen.getByText(/what to fix/i)).toBeInTheDocument();
    const quote = container.querySelector("blockquote");
    // Pre-wrapped, so a note written over several lines stays several lines.
    expect(quote).toHaveTextContent("Line one.");
    expect(quote).toHaveClass("whitespace-pre-wrap");
  });

  it("sends a declined candidate back for review", () => {
    renderWithProviders(
      <ReviewStateNotice
        candidate={candidate({ status: "declined", reviewNote: "Re-upload." })}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /resubmit for review/i }),
    );

    expect(resubmitMock).toHaveBeenCalledWith("cand-1");
  });

  it("reassures the recruiter the company never saw the submission", () => {
    renderWithProviders(
      <ReviewStateNotice
        candidate={candidate({ status: "declined", reviewNote: "Re-upload." })}
      />,
    );

    expect(
      screen.getByText(/company was never told about this submission/i),
    ).toBeInTheDocument();
  });

  it.each([
    "submitted",
    "reviewing",
    "interviewing",
    "offered",
    "hired",
    "passed",
  ] as const)(
    "renders nothing once a candidate is past the gate (%s)",
    (status) => {
      const { container } = renderWithProviders(
        <ReviewStateNotice candidate={candidate({ status })} />,
      );

      expect(container).toBeEmptyDOMElement();
    },
  );
});
