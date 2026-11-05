import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/utils";
import type { Candidate } from "@/features/candidates";
import { SubmissionGateBar } from "./SubmissionGateBar";

// The dialog pulls the whole candidate record and its attachments over the
// wire; this suite is about what the bar says and offers, so the panel itself
// is stubbed down to its trigger.
vi.mock("./SubmissionReviewDialog", () => ({
  SubmissionReviewDialog: ({ trigger }: { trigger?: React.ReactNode }) => (
    <>{trigger}</>
  ),
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

describe("SubmissionGateBar", () => {
  it("offers the review when a submission is held at the gate", () => {
    renderWithProviders(<SubmissionGateBar candidate={candidate()} />);

    expect(screen.getByText(/waiting on your review/i)).toBeInTheDocument();
    // The reason the decision matters, stated rather than implied.
    expect(
      screen.getByText(/company cannot see this submission/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /review ada lovelace's submission/i }),
    ).toBeInTheDocument();
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

    expect(screen.getByText(/sent back to the recruiter/i)).toBeInTheDocument();
    expect(
      screen.getByText("The CV is for a different role."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("says so when a decline carries no reason", () => {
    renderWithProviders(
      <SubmissionGateBar candidate={candidate({ status: "declined" })} />,
    );

    expect(screen.getByText(/no reason was recorded/i)).toBeInTheDocument();
  });

  it("renders nothing once a candidate is past the gate", () => {
    const { container } = renderWithProviders(
      <SubmissionGateBar candidate={candidate({ status: "reviewing" })} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
