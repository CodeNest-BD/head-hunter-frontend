import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/utils";
import type { CandidateNegotiationState } from "@/features/conversations/utils/candidateNegotiationState";
import type { Interview } from "@/features/interviews";
import type { Offer } from "@/features/offers";
import { NegotiationActionCards } from "./NegotiationActionCards";

// `ProposalCard`/`OfferCard` are exercised by their own component tests; this
// file only has to prove this component derives the right data, title and
// `viewerParty` for both mount sites (company and recruiter) and renders
// neither card when there is nothing to act on.
vi.mock("@/features/conversations", () => ({
  ProposalCard: ({
    title,
    data,
    viewerParty,
  }: {
    title: string;
    data: { interviewId: string };
    viewerParty: string;
  }) => (
    <div>
      Proposal card ({viewerParty}) — {title} — {data.interviewId}
    </div>
  ),
  OfferCard: ({
    data,
    viewerParty,
  }: {
    data: { offerId: string; salaryMinor: number | null };
    viewerParty: string;
  }) => (
    <div>
      Offer card ({viewerParty}) — {data.offerId} — {data.salaryMinor}
    </div>
  ),
}));

function interview(overrides: Partial<Interview> & { id: string }): Interview {
  return {
    jobId: "job-1",
    candidateId: "cand-1",
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
    candidateId: "cand-1",
    jobId: "job-1",
    previousOfferId: null,
    createdBy: "company",
    amountMinor: 500000,
    status: "sent",
    placementDetails: null,
    createdAt: "2026-08-10T09:00:00.000Z",
    ...overrides,
  };
}

function state(
  overrides: Partial<CandidateNegotiationState> = {},
): CandidateNegotiationState {
  return {
    interview: null,
    offer: null,
    interviewRecord: null,
    offerRecord: null,
    ...overrides,
  };
}

describe("NegotiationActionCards", () => {
  it("renders nothing when there is no negotiation state", () => {
    const { container } = renderWithProviders(
      <NegotiationActionCards negotiationState={null} viewerParty="company" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when neither an interview nor an offer record is present", () => {
    const { container } = renderWithProviders(
      <NegotiationActionCards
        negotiationState={state()}
        viewerParty="company"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("mounts ProposalCard with the derived title as the company when there is an open proposal", () => {
    renderWithProviders(
      <NegotiationActionCards
        negotiationState={state({
          interviewRecord: interview({
            id: "interview-1",
            liveProposal: { id: "proposal-1", status: "proposed", slots: [] },
          }),
        })}
        viewerParty="company"
      />,
    );

    expect(
      screen.getByText(
        /Proposal card \(company\) — Availability proposed — interview-1/,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Offer card/)).not.toBeInTheDocument();
  });

  it("mounts ProposalCard as the recruiter when that is the viewer", () => {
    renderWithProviders(
      <NegotiationActionCards
        negotiationState={state({
          interviewRecord: interview({
            id: "interview-2",
            liveProposal: { id: "proposal-2", status: "proposed", slots: [] },
          }),
        })}
        viewerParty="recruiter"
      />,
    );

    expect(
      screen.getByText(
        /Proposal card \(recruiter\) — Availability proposed — interview-2/,
      ),
    ).toBeInTheDocument();
  });

  it("mounts OfferCard when there is a live offer", () => {
    renderWithProviders(
      <NegotiationActionCards
        negotiationState={state({
          offerRecord: offer({
            id: "offer-1",
            status: "countered",
            placementDetails: { salaryMinor: 13000000 },
          }),
        })}
        viewerParty="company"
      />,
    );

    expect(
      screen.getByText(/Offer card \(company\) — offer-1 — 13000000/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Proposal card/)).not.toBeInTheDocument();
  });

  it("mounts OfferCard as the recruiter when that is the viewer", () => {
    renderWithProviders(
      <NegotiationActionCards
        negotiationState={state({
          offerRecord: offer({ id: "offer-2" }),
        })}
        viewerParty="recruiter"
      />,
    );

    expect(
      screen.getByText(/Offer card \(recruiter\) — offer-2/),
    ).toBeInTheDocument();
  });

  it("mounts neither card once the interview's proposal has closed", () => {
    const { container } = renderWithProviders(
      <NegotiationActionCards
        negotiationState={state({
          interviewRecord: interview({
            id: "interview-1",
            status: "completed",
            liveProposal: null,
          }),
        })}
        viewerParty="company"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
