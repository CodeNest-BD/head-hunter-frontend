import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";
import type { Interview } from "@/features/interviews/schemas";
import type { Offer, OfferStatus } from "@/features/offers/schemas";
import {
  candidateNegotiationState,
  type CandidateNegotiationState,
} from "@/features/conversations/utils/candidateNegotiationState";
import { ScheduleInterviewAction } from "./ScheduleInterviewAction";

// The barrel is stubbed rather than `importActual`-ed: its real hooks reach
// into `../api/interviews`, which builds an `apiClient` at import time and
// throws without `NEXT_PUBLIC_API_URL` set. Both child components report what
// they were handed; their own behaviour is covered by their own tests.
vi.mock("@/features/interviews", () => ({
  OpenInterviewActions: ({ interview }: { interview: Interview }) => (
    <div>
      Open interview {interview.id} ({interview.status})
    </div>
  ),
  ProposeSlotsForm: ({
    target,
    onDone,
  }: {
    target: { kind: string; candidateId?: string };
    onDone: () => void;
  }) => (
    <div>
      <span>
        Propose form ({target.kind}) for {target.candidateId}
      </span>
      <button type="button" onClick={onDone}>
        Submit the batch
      </button>
    </div>
  ),
}));

function interview(overrides: Partial<Interview> = {}): Interview {
  return {
    id: "interview-1",
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
    createdAt: "2026-08-01T00:00:00.000Z",
    liveProposal: null,
    ...overrides,
  };
}

/** Runs the candidate's interviews through the same derivation the page
 * itself uses, so these tests exercise the real `negotiationState` shape
 * the component is handed rather than a hand-rolled stand-in. */
function negotiationStateFor(
  interviews: Interview[],
  offers: Offer[] = [],
): CandidateNegotiationState | null {
  return (
    candidateNegotiationState(interviews, offers).get("candidate-1") ?? null
  );
}

function offer(status: OfferStatus): Offer {
  return {
    id: "offer-1",
    candidateId: "candidate-1",
    jobId: "job-1",
    previousOfferId: null,
    createdBy: "company",
    amountMinor: 500000,
    status,
    placementDetails: null,
    createdAt: "2026-08-02T00:00:00.000Z",
    companyCanCoverFee: null,
  };
}

function renderAction(negotiationState: CandidateNegotiationState | null) {
  return renderWithProviders(
    <ScheduleInterviewAction
      candidateId="candidate-1"
      negotiationState={negotiationState}
    />,
  );
}

describe("ScheduleInterviewAction", () => {
  it("hands an interview awaiting a time over to its own actions instead of blocking", () => {
    renderAction(negotiationStateFor([interview({ status: "proposed" })]));

    expect(
      screen.getByText(/open interview interview-1 \(proposed\)/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /schedule interview/i }),
    ).not.toBeInTheDocument();
  });

  it("hands a scheduled interview over to its own actions", () => {
    renderAction(negotiationStateFor([interview({ status: "scheduled" })]));

    expect(
      screen.getByText(/open interview interview-1 \(scheduled\)/i),
    ).toBeInTheDocument();
  });

  it("offers to schedule when the candidate's only interview was withdrawn", () => {
    renderAction(negotiationStateFor([interview({ status: "canceled" })]));

    expect(
      screen.getByRole("button", { name: /schedule interview/i }),
    ).toBeEnabled();
    expect(screen.queryByText(/open interview/i)).not.toBeInTheDocument();
  });

  it("opens the propose panel against the candidate, writing no interview until it is submitted", () => {
    renderAction(null);
    fireEvent.click(
      screen.getByRole("button", { name: /schedule interview/i }),
    );

    expect(
      screen.getByText(/propose form \(new\) for candidate-1/i),
    ).toBeInTheDocument();
  });

  it("stays quiet after a batch is proposed, so the button cannot open a second interview mid-refetch", () => {
    const { container } = renderAction(null);
    fireEvent.click(
      screen.getByRole("button", { name: /schedule interview/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /submit the batch/i }));

    expect(container).toBeEmptyDOMElement();
  });

  it("offers the next round once one was asked for", () => {
    renderAction(
      negotiationStateFor([
        interview({ status: "completed", outcome: "next_round" }),
      ]),
    );

    expect(
      screen.getByRole("button", { name: /schedule next round/i }),
    ).toBeEnabled();
  });

  it.each([["sent"], ["accepted"]] as const)(
    "offers no next round while an offer is %s",
    (status) => {
      const { container } = renderAction(
        negotiationStateFor(
          [interview({ status: "completed", outcome: "next_round" })],
          [offer(status)],
        ),
      );

      expect(container).toBeEmptyDOMElement();
    },
  );

  it("offers the next round again once the offer is no longer live", () => {
    renderAction(
      negotiationStateFor(
        [interview({ status: "completed", outcome: "next_round" })],
        [offer("declined")],
      ),
    );

    expect(
      screen.getByRole("button", { name: /schedule next round/i }),
    ).toBeEnabled();
  });

  it.each([["offer"], ["pass"]] as const)(
    "offers no further interview once the outcome was %s",
    (outcome) => {
      const { container } = renderAction(
        negotiationStateFor([interview({ status: "completed", outcome })]),
      );

      expect(container).toBeEmptyDOMElement();
    },
  );
});
