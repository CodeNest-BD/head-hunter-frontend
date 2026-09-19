import { describe, expect, it } from "vitest";
import {
  SLOT_TIME_STEP_MINUTES,
  type Interview,
  type InterviewSlot,
} from "../schemas";
import {
  firstStartDayAfterInterview,
  formatSlotWindow,
  selectableTimeOptions,
  SLOT_TIME_OPTIONS,
  toSlotRange,
} from "./slotTiming";

describe("SLOT_TIME_OPTIONS", () => {
  it("covers a whole day at the configured step", () => {
    expect(SLOT_TIME_OPTIONS).toHaveLength((24 * 60) / SLOT_TIME_STEP_MINUTES);
    expect(SLOT_TIME_OPTIONS[0]).toEqual({ value: "00:00", label: "12:00 AM" });
    expect(SLOT_TIME_OPTIONS.at(-1)).toEqual({
      value: "23:45",
      label: "11:45 PM",
    });
  });

  it("labels an afternoon time as the company reads it", () => {
    expect(
      SLOT_TIME_OPTIONS.find((option) => option.value === "15:15")?.label,
    ).toBe("3:15 PM");
  });
});

describe("toSlotRange", () => {
  // Asserted through the local clock rather than a fixed ISO string: the point
  // of the conversion is that a company sees back the wall-clock hours it
  // picked, whatever timezone it sits in.
  it("keeps the wall-clock start the company picked", () => {
    const { startAt } = toSlotRange({
      day: "2026-08-19",
      startTime: "15:00",
      durationMinutes: 45,
    });
    const start = new Date(startAt);

    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(7);
    expect(start.getDate()).toBe(19);
    expect(start.getHours()).toBe(15);
    expect(start.getMinutes()).toBe(0);
  });

  it("derives the end from the chosen length", () => {
    const { startAt, endAt } = toSlotRange({
      day: "2026-08-19",
      startTime: "15:00",
      durationMinutes: 45,
    });

    expect(Date.parse(endAt) - Date.parse(startAt)).toBe(45 * 60 * 1000);
  });

  it("carries a window over midnight into the next day", () => {
    const { endAt } = toSlotRange({
      day: "2026-08-19",
      startTime: "23:45",
      durationMinutes: 30,
    });
    const end = new Date(endAt);

    expect(end.getDate()).toBe(20);
    expect(end.getHours()).toBe(0);
    expect(end.getMinutes()).toBe(15);
  });
});

describe("formatSlotWindow", () => {
  it("previews a same-day window under its one date", () => {
    expect(
      formatSlotWindow({
        day: "2026-08-19",
        startTime: "15:00",
        durationMinutes: 45,
      }),
    ).toBe("Aug 19, 2026 · 3:00 PM – 3:45 PM");
  });

  it("names both dates when the length carries the window past midnight", () => {
    expect(
      formatSlotWindow({
        day: "2026-08-19",
        startTime: "23:30",
        durationMinutes: 90,
      }),
    ).toBe("Aug 19, 2026, 11:30 PM – Aug 20, 2026, 1:00 AM");
  });
});

describe("selectableTimeOptions", () => {
  it("offers every time on a future day", () => {
    const now = new Date("2026-08-22T14:30:00");

    expect(selectableTimeOptions("2026-08-23", now)).toHaveLength(
      SLOT_TIME_OPTIONS.length,
    );
  });

  it("drops times that have already passed today", () => {
    const now = new Date("2026-08-22T14:30:00");

    const values = selectableTimeOptions("2026-08-22", now).map((o) => o.value);

    expect(values).not.toContain("09:00");
    expect(values).not.toContain("14:00");
  });

  it("keeps the rest of today available", () => {
    const now = new Date("2026-08-22T14:30:00");

    expect(
      selectableTimeOptions("2026-08-22", now).map((o) => o.value),
    ).toContain("15:00");
  });

  it("returns an empty list late at night, so the caller can say so", () => {
    const now = new Date("2026-08-22T23:59:00");

    expect(selectableTimeOptions("2026-08-22", now)).toHaveLength(0);
  });

  it("offers every time when no day is chosen yet", () => {
    expect(
      selectableTimeOptions("", new Date("2026-08-22T14:30:00")),
    ).toHaveLength(SLOT_TIME_OPTIONS.length);
  });
});

describe("firstStartDayAfterInterview", () => {
  const interview = (overrides: Partial<Interview>): Interview => ({
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
    createdAt: "2026-09-10T09:00:00.000Z",
    liveProposal: null,
    ...overrides,
  });

  const slot = (id: string, startAt: string, endAt: string): InterviewSlot => ({
    id,
    startAt,
    endAt,
  });

  it("has no floor of its own when the interview carries no time yet", () => {
    expect(firstStartDayAfterInterview(interview({}))).toBe("");
    expect(firstStartDayAfterInterview(null)).toBe("");
  });

  it("clears the day a scheduled interview ends on", () => {
    expect(
      firstStartDayAfterInterview(
        interview({
          status: "scheduled",
          confirmedSlotStart: "2026-09-19T08:15:00",
          confirmedSlotEnd: "2026-09-19T08:45:00",
        }),
      ),
    ).toBe("2026-09-20");
  });

  it("clears the latest proposed time, not the earliest", () => {
    expect(
      firstStartDayAfterInterview(
        interview({
          liveProposal: {
            id: "proposal-1",
            status: "proposed",
            slots: [
              slot("slot-1", "2026-09-19T08:15:00", "2026-09-19T08:45:00"),
              slot("slot-2", "2026-09-23T08:15:00", "2026-09-23T08:45:00"),
              slot("slot-3", "2026-09-21T08:15:00", "2026-09-21T08:45:00"),
            ],
          },
        }),
      ),
    ).toBe("2026-09-24");
  });
});
