import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test/utils";
import type { Candidate } from "@/features/candidates";
import { SubmissionGateBar } from "./SubmissionGateBar";

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

describe("SubmissionGateBar", () => {
  it("says why a submission is stuck, and who it is stuck on", () => {
    renderWithProviders(<SubmissionGateBar candidate={candidate()} />);

    expect(screen.getByText(/waiting on your review/i)).toBeInTheDocument();
    // The reason the decision matters, stated rather than implied.
    expect(
      screen.getByText(/company cannot see this submission/i),
    ).toBeInTheDocument();
  });

  it("renders whatever way of acting the page gave it", () => {
    // The conversation page lays the decision out beside the thread and
    // passes nothing; a split view with no room passes the dialog.
    renderWithProviders(
      <SubmissionGateBar
        candidate={candidate()}
        action={<button type="button">Review Submission</button>}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Review Submission" }),
    ).toBeInTheDocument();
  });

  it("offers nothing to press when the page acts for itself", () => {
    renderWithProviders(<SubmissionGateBar candidate={candidate()} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the reason it was sent back, and offers no decision to re-make", () => {
    renderWithProviders(
      <SubmissionGateBar
        candidate={candidate({
          status: "declined",
          reviewNote: "The CV is for a different role.",
          reviewedAt: new Date("2026-11-04T10:00:00.000Z"),
        })}
      />,
    );

    expect(screen.getByText(/^Rejected/)).toBeInTheDocument();
    expect(
      screen.getByText("The CV is for a different role."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("says so when a rejection carries no note", () => {
    renderWithProviders(
      <SubmissionGateBar candidate={candidate({ status: "declined" })} />,
    );

    expect(screen.getByText(/no note was left/i)).toBeInTheDocument();
  });

  it("renders nothing once a candidate is past the gate", () => {
    const { container } = renderWithProviders(
      <SubmissionGateBar candidate={candidate({ status: "reviewing" })} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
