import { describe, expect, it } from "vitest";
import {
  MAX_PROPOSAL_SLOTS,
  SLOT_TIME_STEP_MINUTES,
  type Interview,
  type InterviewSlot,
} from "../schemas";
import {
  expandWindow,
  firstStartDayAfterInterview,
  formatSlotWindow,
  selectableEndTimes,
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

describe("expandWindow", () => {
  const day = "2026-11-10";

  it("turns a hiring manager's window into back-to-back slots", () => {
    // The client's own example: available 9:00–11:00, hour-long interviews.
    expect(
      expandWindow({
        day,
        startTime: "09:00",
        endTime: "11:00",
        durationMinutes: 60,
      }),
    ).toEqual([
      { day, startTime: "09:00", durationMinutes: 60 },
      { day, startTime: "10:00", durationMinutes: 60 },
    ]);
  });

  it("drops a trailing remainder too short to hold a full interview", () => {
    // 9:00–11:45 at 60 minutes is two interviews, not two and a 45-min stub
    // that would disagree with the length shown on screen.
    const slots = expandWindow({
      day,
      startTime: "09:00",
      endTime: "11:45",
      durationMinutes: 60,
    });

    expect(slots.map((slot) => slot.startTime)).toEqual(["09:00", "10:00"]);
  });

  it("treats an unset end time as a single slot", () => {
    expect(
      expandWindow({
        day,
        startTime: "14:30",
        endTime: "",
        durationMinutes: 45,
      }),
    ).toEqual([{ day, startTime: "14:30", durationMinutes: 45 }]);
  });

  it("still offers one slot when the window is shorter than the length", () => {
    // Picking 9:00–9:15 with a 30-minute length means an interview at 9:00,
    // not no interview at all.
    expect(
      expandWindow({
        day,
        startTime: "09:00",
        endTime: "09:15",
        durationMinutes: 30,
      }),
    ).toEqual([{ day, startTime: "09:00", durationMinutes: 30 }]);
  });

  it("reports the whole window, leaving the batch cap to the caller", () => {
    // A working day at 30 minutes really is 16 interviews. Capping here would
    // hide the other 11 from the form, which needs the true count to say how
    // many did not fit.
    const slots = expandWindow({
      day,
      startTime: "09:00",
      endTime: "17:00",
      durationMinutes: 30,
    });

    expect(slots).toHaveLength(16);
    expect(slots.length).toBeGreaterThan(MAX_PROPOSAL_SLOTS);
    expect(slots.at(-1)).toEqual({
      day,
      startTime: "16:30",
      durationMinutes: 30,
    });
  });
});

describe("selectableEndTimes", () => {
  it("offers only times later the same day", () => {
    const options = selectableEndTimes("23:00", SLOT_TIME_OPTIONS);

    expect(options.map((option) => option.value)).toEqual([
      "23:15",
      "23:30",
      "23:45",
    ]);
  });

  it("offers nothing once the start is the last slot of the day", () => {
    expect(selectableEndTimes("23:45", SLOT_TIME_OPTIONS)).toEqual([]);
  });
});
