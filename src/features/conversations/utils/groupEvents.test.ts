import { describe, expect, it } from "vitest";

import type { ConversationEvent } from "../schemas";
import { groupEvents } from "./groupEvents";

function messageEvent(
  overrides: Partial<ConversationEvent> & { at: string },
): ConversationEvent {
  return {
    type: "message",
    actor: "recruiter",
    title: "Message",
    body: "hello",
    candidateId: null,
    messageId: null,
    data: null,
    ...overrides,
  };
}

function proposalEvent(at: string): ConversationEvent {
  return {
    type: "proposal",
    at,
    actor: "company",
    title: "Interview proposed",
    body: null,
    candidateId: "cand1",
    messageId: null,
    data: {
      kind: "proposal",
      interviewId: "interview-1",
      availabilityProposalId: "prop-1",
      proposalStatus: "proposed",
      interviewStatus: "proposed",
      confirmedSlotStart: null,
      confirmedSlotEnd: null,
      slots: [],
    },
  };
}

function offerEvent(at: string): ConversationEvent {
  return {
    type: "offer",
    at,
    actor: "company",
    title: "Offer sent",
    body: null,
    candidateId: "cand1",
    messageId: null,
    data: {
      kind: "offer",
      offerId: "offer-1",
      offerStatus: "sent",
      amountMinor: 500000,
      salaryMinor: 13000000,
      jobTitle: "Staff Engineer",
      startDate: null,
      previousOfferId: null,
      createdBy: "company",
    },
  };
}

describe("groupEvents", () => {
  it("groups consecutive messages from the same actor into one group", () => {
    const events = [
      messageEvent({ at: "2026-08-10T09:00:00.000Z", messageId: "m1" }),
      messageEvent({ at: "2026-08-10T09:01:00.000Z", messageId: "m2" }),
    ];

    const items = groupEvents(events, "company");

    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      kind: "day",
      date: "2026-08-10T09:00:00.000Z",
    });
    expect(items[1]).toMatchObject({
      kind: "messages",
      actor: "recruiter",
      events: [events[0], events[1]],
    });
  });

  it("starts a new group when the actor changes", () => {
    const events = [
      messageEvent({
        at: "2026-08-10T09:00:00.000Z",
        actor: "recruiter",
        messageId: "m1",
      }),
      messageEvent({
        at: "2026-08-10T09:01:00.000Z",
        actor: "company",
        messageId: "m2",
      }),
    ];

    const items = groupEvents(events, "company");

    const messageGroups = items.filter((item) => item.kind === "messages");
    expect(messageGroups).toHaveLength(2);
  });

  it("inserts a day separator when the calendar day changes", () => {
    const events = [
      messageEvent({ at: "2026-08-10T09:00:00.000Z", messageId: "m1" }),
      messageEvent({ at: "2026-08-11T09:00:00.000Z", messageId: "m2" }),
    ];

    const items = groupEvents(events, "company");

    const daySeparators = items.filter((item) => item.kind === "day");
    expect(daySeparators).toHaveLength(2);
  });

  it("does not group across a day boundary even for the same actor", () => {
    const events = [
      messageEvent({
        at: "2026-08-10T09:00:00.000Z",
        actor: "recruiter",
        messageId: "m1",
      }),
      messageEvent({
        at: "2026-08-11T09:00:00.000Z",
        actor: "recruiter",
        messageId: "m2",
      }),
    ];

    const items = groupEvents(events, "company");

    const messageGroups = items.filter((item) => item.kind === "messages");
    expect(messageGroups).toHaveLength(2);
    expect(messageGroups[0]).toMatchObject({ events: [events[0]] });
    expect(messageGroups[1]).toMatchObject({ events: [events[1]] });
  });

  it("marks the viewer's own messages as own", () => {
    const events = [
      messageEvent({
        at: "2026-08-10T09:00:00.000Z",
        actor: "company",
        messageId: "m1",
      }),
      messageEvent({
        at: "2026-08-10T09:01:00.000Z",
        actor: "recruiter",
        messageId: "m2",
      }),
    ];

    const items = groupEvents(events, "company");
    const messageGroups = items.filter((item) => item.kind === "messages");

    expect(messageGroups[0]).toMatchObject({ actor: "company", isOwn: true });
    expect(messageGroups[1]).toMatchObject({
      actor: "recruiter",
      isOwn: false,
    });
  });

  it("keeps proposal and offer events as standalone items", () => {
    const proposal = proposalEvent("2026-08-10T09:00:00.000Z");
    const offer = offerEvent("2026-08-10T09:05:00.000Z");

    const items = groupEvents([proposal, offer], "company");

    const eventItems = items.filter((item) => item.kind === "event");
    expect(eventItems).toEqual([
      { kind: "event", event: proposal },
      { kind: "event", event: offer },
    ]);
  });

  it("does not throw for an event with a malformed timestamp", () => {
    const events = [
      messageEvent({ at: "not-a-real-date", messageId: "m1" }),
      messageEvent({ at: "2026-08-10T09:00:00.000Z", messageId: "m2" }),
    ];

    expect(() => groupEvents(events, "company")).not.toThrow();
    const items = groupEvents(events, "company");
    const daySeparators = items.filter((item) => item.kind === "day");
    // The malformed row still gets its own day boundary — it degrades
    // instead of silently merging into (or crashing on top of) a real day.
    expect(daySeparators).toHaveLength(2);
  });
});
