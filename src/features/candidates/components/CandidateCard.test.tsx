import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/utils";
import type { Candidate } from "../schemas";
import { CandidateCard } from "./CandidateCard";

// This card's own status dropdown/actions are exercised by
// ScheduleInterviewAction.test.tsx and SendOfferForm.test.tsx; stubbed here so
// this file only has to prove the negotiation badges are wired in without
// also standing up their own network mocks.
vi.mock("./ScheduleInterviewAction", () => ({
  ScheduleInterviewAction: () => <div>Schedule interview action</div>,
}));
vi.mock("./SendOfferForm", () => ({
  SendOfferForm: () => <div>Send offer form</div>,
}));
vi.mock("../hooks/useCandidates", () => ({
  useUpdateCandidateStatus: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useAttachments: () => ({ data: undefined, isPending: false, isError: false }),
}));

function candidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: "candidate-1",
    submissionId: "submission-1",
    fullName: "Dana Lee",
    email: "dana@example.com",
    phone: null,
    overview: null,
    linkedinUrl: null,
    yearsOfExperience: null,
    currentCompany: null,
    expectedSalaryMinor: null,
    noticePeriodDays: null,
    status: "submitted",
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("CandidateCard", () => {
  it("shows an explicit empty state for both badges when the candidate has no negotiation history", () => {
    renderWithProviders(
      <CandidateCard
        candidate={candidate()}
        submissionId="submission-1"
        negotiationState={null}
      />,
    );

    expect(screen.getByText(/Interview:/)).toHaveTextContent(
      "Interview: none yet",
    );
    expect(screen.getByText(/Offer:/)).toHaveTextContent("Offer: none yet");
  });

  it("shows the interview and offer state without touching the status dropdown", () => {
    renderWithProviders(
      <CandidateCard
        candidate={candidate()}
        submissionId="submission-1"
        negotiationState={{
          interview: { kind: "awaiting_time" },
          offer: { kind: "sent", salaryMinor: 13000000 },
        }}
      />,
    );

    expect(screen.getByText(/Interview:/)).toHaveTextContent(
      "Interview: awaiting a time",
    );
    expect(screen.getByText(/Offer:/)).toHaveTextContent(
      "Offer: offer sent · $130,000",
    );
    expect(
      screen.getByRole("combobox", { name: /status for dana lee/i }),
    ).toHaveValue("submitted");
  });
});
