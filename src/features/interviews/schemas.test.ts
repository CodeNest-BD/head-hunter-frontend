import { describe, expect, it } from "vitest";
import { interviewSchema, proposalSchema } from "./schemas";

const interview = {
  id: "11111111-1111-4111-8111-111111111111",
  jobId: "22222222-2222-4222-8222-222222222222",
  candidateId: "33333333-3333-4333-8333-333333333333",
  interviewType: "video",
  status: "proposed",
  round: 1,
  confirmedSlotStart: null,
  confirmedSlotEnd: null,
  meetingJoinUrl: null,
  outcome: null,
  passFeedback: null,
  createdAt: "2026-08-11T09:00:00.000Z",
};

describe("interviewSchema", () => {
  it("parses an interview awaiting a time, with no confirmed slot or outcome yet", () => {
    const parsed = interviewSchema.parse(interview);
    expect(parsed.confirmedSlotStart).toBeNull();
    expect(parsed.outcome).toBeNull();
  });

  it("parses a scheduled interview with a confirmed slot and meeting link", () => {
    const parsed = interviewSchema.parse({
      ...interview,
      status: "scheduled",
      confirmedSlotStart: "2026-09-01T16:00:00.000Z",
      confirmedSlotEnd: "2026-09-01T17:00:00.000Z",
      meetingJoinUrl: "https://zoom.us/j/1234567890",
    });
    expect(parsed.confirmedSlotStart).toBe("2026-09-01T16:00:00.000Z");
    expect(parsed.meetingJoinUrl).toBe("https://zoom.us/j/1234567890");
  });

  it("parses a completed interview with its recorded outcome", () => {
    const parsed = interviewSchema.parse({
      ...interview,
      status: "completed",
      outcome: "pass",
      passFeedback: "Strong on system design, weak on communication.",
    });
    expect(parsed.outcome).toBe("pass");
  });
});

describe("proposalSchema", () => {
  it("parses a batch of proposed slots", () => {
    const parsed = proposalSchema.parse({
      id: "44444444-4444-4444-8444-444444444444",
      status: "proposed",
      note: null,
      slots: [
        {
          id: "55555555-5555-4555-8555-555555555555",
          startAt: "2026-09-01T16:00:00.000Z",
          endAt: "2026-09-01T17:00:00.000Z",
        },
      ],
    });
    expect(parsed.slots).toHaveLength(1);
  });

  it("parses a counter-requested proposal with its note", () => {
    const parsed = proposalSchema.parse({
      id: "44444444-4444-4444-8444-444444444444",
      status: "counter_requested",
      note: "Mornings only, please.",
      slots: [],
    });
    expect(parsed.note).toBe("Mornings only, please.");
  });
});
