import { describe, expect, it } from "vitest";

import type { Interview } from "@/features/interviews";
import { proposalCardTitle, toProposalEventData } from "./toProposalEventData";

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

describe("toProposalEventData", () => {
  it("returns null for an interview with no open proposal", () => {
    expect(
      toProposalEventData(interview({ id: "int-1", liveProposal: null })),
    ).toBeNull();
  });

  it("maps the open proposal onto the shape ProposalCard renders", () => {
    const mapped = toProposalEventData(
      interview({
        id: "int-1",
        status: "proposed",
        liveProposal: {
          id: "prop-1",
          status: "proposed",
          slots: [
            {
              id: "slot-1",
              startAt: "2026-09-01T16:00:00.000Z",
              endAt: "2026-09-01T17:00:00.000Z",
            },
          ],
        },
      }),
    );

    expect(mapped).toEqual({
      kind: "proposal",
      interviewId: "int-1",
      availabilityProposalId: "prop-1",
      proposalStatus: "proposed",
      interviewStatus: "proposed",
      confirmedSlotStart: null,
      confirmedSlotEnd: null,
      slots: [
        {
          id: "slot-1",
          startAt: "2026-09-01T16:00:00.000Z",
          endAt: "2026-09-01T17:00:00.000Z",
        },
      ],
    });
  });
});

describe("proposalCardTitle", () => {
  it("matches the backend's PROPOSAL_TITLES wording for each status", () => {
    expect(proposalCardTitle("proposed")).toBe("Availability proposed");
    expect(proposalCardTitle("counter_requested")).toBe("New times requested");
    expect(proposalCardTitle("confirmed")).toBe("Interview time confirmed");
    expect(proposalCardTitle("expired")).toBe("Availability expired");
  });
});
