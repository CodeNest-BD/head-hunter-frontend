import { describe, expect, it } from "vitest";
import { SLOT_TIME_STEP_MINUTES } from "../schemas";
import { formatSlotWindow, SLOT_TIME_OPTIONS, toSlotRange } from "./slotTiming";

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
