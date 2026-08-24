import { describe, expect, it } from "vitest";
import { conversationThreadSchema } from "./schemas";

// `events` is the API's `{ data, meta }` pagination envelope, not a bare
// array — see ParticipantThreadDto in the backend contract.
const thread = {
  candidate: {
    id: "cand1",
    jobId: "j1",
    recruiterProfileId: "r1",
    fullName: "J. Rivera",
    email: "rivera@example.com",
    phone: null,
    overview: null,
    pitch: null,
    linkedinUrl: null,
    yearsOfExperience: null,
    currentCompany: null,
    expectedSalaryMinor: null,
    noticePeriodDays: null,
    status: "submitted",
    createdAt: "2026-08-11T09:00:00.000Z",
  },
  acceptsMessages: true,
  company: { profileId: "c1", name: "Acme" },
  recruiter: { profileId: "r1", name: "Dana Lee" },
  job: { id: "j1", title: "Staff Engineer", recruiterFeeMinor: 1000000 },
  events: {
    data: [
      {
        type: "message",
        at: "2026-08-11T09:00:00.000Z",
        actor: "recruiter",
        title: "Message",
        body: "Strong fit.",
        candidateId: "cand1",
        messageId: "m1",
      },
    ],
    meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
  },
};

describe("conversationThreadSchema", () => {
  it("parses a thread containing a message event", () => {
    expect(conversationThreadSchema.parse(thread).events.data).toHaveLength(1);
  });

  it("degrades an unfamiliar event type to unknown", () => {
    const parsed = conversationThreadSchema.parse({
      ...thread,
      events: {
        ...thread.events,
        data: [{ ...thread.events.data[0], type: "placement" }],
      },
    });
    expect(parsed.events.data[0].type).toBe("unknown");
  });

  it("accepts a system event with no candidate or message id", () => {
    const parsed = conversationThreadSchema.parse({
      ...thread,
      events: {
        ...thread.events,
        data: [
          {
            type: "submission",
            at: "2026-08-11T08:00:00.000Z",
            actor: "recruiter",
            title: "Candidates submitted",
            body: null,
            candidateId: null,
            messageId: null,
          },
        ],
      },
    });
    expect(parsed.events.data[0].messageId).toBeNull();
  });

  it("parses a proposal event with its slots", () => {
    const parsed = conversationThreadSchema.parse({
      ...thread,
      events: {
        ...thread.events,
        data: [
          {
            ...thread.events.data[0],
            type: "proposal",
            data: {
              kind: "proposal",
              interviewId: "int1",
              availabilityProposalId: "prop1",
              proposalStatus: "proposed",
              interviewStatus: "proposed",
              confirmedSlotStart: null,
              confirmedSlotEnd: null,
              slots: [
                {
                  id: "slot1",
                  startAt: "2026-09-01T16:00:00.000Z",
                  endAt: "2026-09-01T17:00:00.000Z",
                },
              ],
            },
          },
        ],
      },
    });
    const event = parsed.events.data[0];
    expect(event.data?.kind).toBe("proposal");
    expect(event.data?.kind === "proposal" && event.data.slots).toHaveLength(1);
  });

  it("parses an offer event with its salary and status", () => {
    const parsed = conversationThreadSchema.parse({
      ...thread,
      events: {
        ...thread.events,
        data: [
          {
            ...thread.events.data[0],
            type: "offer",
            data: {
              kind: "offer",
              offerId: "offer1",
              offerStatus: "sent",
              amountMinor: 500000,
              salaryMinor: 13000000,
              jobTitle: "Staff Engineer",
              startDate: "2026-09-01",
              previousOfferId: null,
              createdBy: "company",
            },
          },
        ],
      },
    });
    const event = parsed.events.data[0];
    expect(event.type).toBe("offer");
    expect(event.data?.kind).toBe("offer");
    expect(event.data?.kind === "offer" && event.data.salaryMinor).toBe(
      13000000,
    );
    expect(event.data?.kind === "offer" && event.data.offerStatus).toBe("sent");
  });

  it("parses an offer event with a null salary", () => {
    const parsed = conversationThreadSchema.parse({
      ...thread,
      events: {
        ...thread.events,
        data: [
          {
            ...thread.events.data[0],
            type: "offer",
            data: {
              kind: "offer",
              offerId: "offer1",
              offerStatus: "countered",
              amountMinor: 500000,
              salaryMinor: null,
              jobTitle: null,
              startDate: null,
              previousOfferId: "offer0",
              createdBy: "recruiter",
            },
          },
        ],
      },
    });
    const event = parsed.events.data[0];
    expect(event.data?.kind === "offer" && event.data.salaryMinor).toBeNull();
  });

  it("does not degrade the offer event type to unknown", () => {
    const parsed = conversationThreadSchema.parse({
      ...thread,
      events: {
        ...thread.events,
        data: [{ ...thread.events.data[0], type: "offer", data: null }],
      },
    });
    expect(parsed.events.data[0].type).toBe("offer");
  });

  it("parses an event with no actionable payload", () => {
    const parsed = conversationThreadSchema.parse({
      ...thread,
      events: {
        ...thread.events,
        data: [{ ...thread.events.data[0], data: null }],
      },
    });
    expect(parsed.events.data[0].data).toBeNull();
  });

  it("degrades an unrecognised data.kind to null instead of throwing", () => {
    const parsed = conversationThreadSchema.parse({
      ...thread,
      events: {
        ...thread.events,
        data: [
          {
            ...thread.events.data[0],
            data: { kind: "offer", interviewId: "int1" },
          },
        ],
      },
    });
    expect(parsed.events.data[0].data).toBeNull();
  });
});
