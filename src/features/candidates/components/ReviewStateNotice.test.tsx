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
      screen.queryByRole("button", { name: /send back for review/i }),
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

  it("still renders when an admin declined without a note", () => {
    renderWithProviders(
      <ReviewStateNotice candidate={candidate({ status: "declined" })} />,
    );

    expect(screen.getByText(/no reason was given/i)).toBeInTheDocument();
  });

  it("sends a declined candidate back for review", () => {
    renderWithProviders(
      <ReviewStateNotice
        candidate={candidate({ status: "declined", reviewNote: "Re-upload." })}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /send back for review/i }),
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
      screen.getByText(/company was not told about this submission/i),
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
