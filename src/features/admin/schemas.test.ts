import { describe, expect, it } from "vitest";
import { conversationEventSchema, conversationThreadSchema } from "./schemas";

const base = {
  at: "2026-08-11T09:00:00.000Z",
  actor: "recruiter" as const,
  title: "Something happened",
  body: null,
  candidateId: null,
  messageId: null,
};

describe("conversationEventSchema", () => {
  it("parses the event types the backend emits today", () => {
    expect(
      conversationEventSchema.parse({ ...base, type: "proposal" }).type,
    ).toBe("proposal");
  });

  it("parses a message event", () => {
    expect(
      conversationEventSchema.parse({ ...base, type: "message" }).type,
    ).toBe("message");
  });

  it("degrades an unrecognised type to unknown rather than throwing", () => {
    expect(
      conversationEventSchema.parse({ ...base, type: "placement" }).type,
    ).toBe("unknown");
  });
});

// `events` is the API's `{ data, meta }` pagination envelope, not a bare
// array — admin now pages through the same envelope the participant view
// does (see ParticipantThreadDto in the backend contract).
const thread = {
  candidate: {
    id: "11111111-1111-4111-8111-111111111111",
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
    data: [{ ...base, type: "message" }],
    meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
  },
};

describe("conversationThreadSchema", () => {
  it("parses a thread whose events are a paginated envelope", () => {
    const parsed = conversationThreadSchema.parse(thread);
    expect(parsed.events.data).toHaveLength(1);
    expect(parsed.events.meta.totalPages).toBe(1);
  });

  it("degrades an unfamiliar event type to unknown", () => {
    const parsed = conversationThreadSchema.parse({
      ...thread,
      events: {
        ...thread.events,
        data: [{ ...base, type: "placement" }],
      },
    });
    expect(parsed.events.data[0].type).toBe("unknown");
  });

  it("carries the whole candidate, so the pane and the thread are one request", () => {
    const parsed = conversationThreadSchema.parse(thread);
    expect(parsed.candidate.fullName).toBe("J. Rivera");
    expect(parsed.job.recruiterFeeMinor).toBe(1000000);
  });
});
