import { describe, expect, it } from "vitest";

import type { Interview } from "@/features/interviews";
import type { Offer } from "@/features/offers";
import { candidateNegotiationState } from "./candidateNegotiationState";

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

describe("candidateNegotiationState", () => {
  it("reports no interview and no offer for an untouched candidate", () => {
    const state = candidateNegotiationState([], []);

    expect(state.get("cand-1")).toBeUndefined();
  });

  it("reports the latest interview when a candidate has several rounds", () => {
    const interviews = [
      interview({
        id: "int-1",
        candidateId: "cand-1",
        round: 1,
        status: "canceled",
      }),
      interview({
        id: "int-2",
        candidateId: "cand-1",
        round: 2,
        status: "proposed",
      }),
    ];

    const state = candidateNegotiationState(interviews, []);

    expect(state.get("cand-1")?.interview).toEqual({ kind: "awaiting_time" });
  });

  it("reports a confirmed time when a slot has been confirmed", () => {
    const interviews = [
      interview({
        id: "int-1",
        candidateId: "cand-1",
        round: 1,
        status: "scheduled",
        confirmedSlotStart: "2026-08-13T14:00:00.000Z",
        confirmedSlotEnd: "2026-08-13T14:30:00.000Z",
      }),
    ];

    const state = candidateNegotiationState(interviews, []);

    expect(state.get("cand-1")?.interview).toEqual({
      kind: "scheduled",
      confirmedSlotStart: "2026-08-13T14:00:00.000Z",
      confirmedSlotEnd: "2026-08-13T14:30:00.000Z",
    });
  });

  it("reports the live offer and ignores superseded ones", () => {
    const offers = [
      offer({
        id: "offer-1",
        candidateId: "cand-1",
        status: "superseded",
        createdAt: "2026-08-10T09:00:00.000Z",
        placementDetails: { salaryMinor: 12000000 },
      }),
      offer({
        id: "offer-2",
        candidateId: "cand-1",
        status: "countered",
        previousOfferId: "offer-1",
        createdAt: "2026-08-11T09:00:00.000Z",
        placementDetails: { salaryMinor: 13000000 },
      }),
    ];

    const state = candidateNegotiationState([], offers);

    expect(state.get("cand-1")?.offer).toEqual({
      kind: "countered",
      salaryMinor: 13000000,
    });
  });

  it("reports no offer when every offer on a candidate has been superseded", () => {
    const offers = [
      offer({ id: "offer-1", candidateId: "cand-1", status: "superseded" }),
    ];

    const state = candidateNegotiationState([], offers);

    expect(state.get("cand-1")?.offer).toBeNull();
  });

  it("returns a map keyed by candidate id so a card does no searching", () => {
    const interviews = [
      interview({
        id: "int-1",
        candidateId: "cand-1",
        round: 1,
        status: "proposed",
      }),
    ];
    const offers = [
      offer({ id: "offer-1", candidateId: "cand-2", status: "sent" }),
    ];

    const state = candidateNegotiationState(interviews, offers);

    expect(state.get("cand-1")).toEqual({
      interview: { kind: "awaiting_time" },
      offer: null,
    });
    expect(state.get("cand-2")).toEqual({
      interview: null,
      offer: { kind: "sent", salaryMinor: null },
    });
    expect(state.get("cand-3")).toBeUndefined();
  });
});
