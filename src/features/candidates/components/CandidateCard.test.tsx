import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/utils";
import type { Interview } from "@/features/interviews";
import type { Offer } from "@/features/offers";
import type { Candidate } from "../schemas";
import { CandidateCard } from "./CandidateCard";

// This card's own actions are exercised by
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
  useAttachments: () => ({ data: undefined, isPending: false, isError: false }),
}));

function interview(overrides: Partial<Interview> & { id: string }): Interview {
  return {
    jobId: "job-1",
    candidateId: "candidate-1",
    interviewType: "video",
    status: "proposed",
    round: 1,
    confirmedSlotStart: null,
    confirmedSlotEnd: null,
    meetingJoinUrl: null,
    outcome: null,
    passFeedback: null,
    createdAt: "2026-08-10T09:00:00.000Z",
    liveProposal: null,
    ...overrides,
  };
}

function offer(overrides: Partial<Offer> & { id: string }): Offer {
  return {
    candidateId: "candidate-1",
    jobId: "job-1",
    previousOfferId: null,
    createdBy: "company",
    amountMinor: 500000,
    status: "sent",
    placementDetails: null,
    createdAt: "2026-08-10T09:00:00.000Z",
    companyCanCoverFee: null,
    ...overrides,
  };
}

function candidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: "candidate-1",
    jobId: "job-1",
    recruiterProfileId: "rec-1",
    fullName: "Dana Lee",
    email: "dana@example.com",
    phone: null,
    overview: null,
    pitch: null,
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
      <CandidateCard candidate={candidate()} negotiationState={null} />,
    );

    expect(screen.getByText(/Interview:/)).toHaveTextContent(
      "Interview: none yet",
    );
    expect(screen.getByText(/Offer:/)).toHaveTextContent("Offer: none yet");
  });

  it("shows the interview and offer state alongside the read-only status", () => {
    renderWithProviders(
      <CandidateCard
        candidate={candidate()}
        negotiationState={{
          interview: { kind: "awaiting_time" },
          offer: { kind: "sent", salaryMinor: 13000000 },
          interviewRecord: null,
          offerRecord: null,
        }}
      />,
    );

    expect(screen.getByText(/Interview:/)).toHaveTextContent(
      "Interview: awaiting a time",
    );
    expect(screen.getByText(/Offer:/)).toHaveTextContent(
      "Offer: offer sent · $130,000",
    );
    expect(screen.getByText("Submitted")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("delegates responding to a live offer to the thread, keeping only create actions on the rail", () => {
    // Accepting, declining or countering a live offer happens on the
    // actionable card in the conversation thread beside this rail — the rail
    // must not render a second set of those buttons. Its own create actions
    // (schedule an interview, send an offer) still live here.
    renderWithProviders(
      <CandidateCard
        candidate={candidate()}
        negotiationState={{
          interview: { kind: "awaiting_time" },
          offer: { kind: "sent", salaryMinor: null },
          interviewRecord: interview({ id: "interview-1" }),
          offerRecord: offer({ id: "offer-1" }),
        }}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /^accept$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^counter$/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Schedule interview action")).toBeInTheDocument();
    expect(screen.getByText("Send offer form")).toBeInTheDocument();
  });
});
