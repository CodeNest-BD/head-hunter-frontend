import { describe, expect, it } from "vitest";

import type { DisputeCountdown } from "../schemas";
import { describeCountdown } from "./describeCountdown";

const DAY_MS = 86_400_000;

function countdown(overrides: Partial<DisputeCountdown>): DisputeCountdown {
  return {
    state: "paused",
    pausedMs: 0,
    remainingMs: null,
    joiningDate: "2026-01-01",
    releaseAt: "2026-01-31T00:00:00.000Z",
    ...overrides,
  };
}

describe("describeCountdown", () => {
  it("states how long an open dispute has paused the countdown and what was left", () => {
    expect(
      describeCountdown(
        countdown({
          state: "paused",
          pausedMs: 3 * DAY_MS + 4 * 3_600_000,
          remainingMs: 20 * DAY_MS,
        }),
      ),
    ).toBe(
      "Paused for 3 days 4 hours so far. 20 days of the countdown was left when this dispute was raised.",
    );
  });

  it("does not claim a pause for a closed dispute raised after the countdown ended", () => {
    expect(
      describeCountdown(countdown({ state: "stopped", pausedMs: 0 })),
    ).not.toContain("paused for");
  });

  it("reads a sub-minute pause as less than a minute", () => {
    expect(
      describeCountdown(
        countdown({ state: "paused", pausedMs: 30_000, remainingMs: 60_000 }),
      ),
    ).toContain("Paused for less than a minute so far. 1 minute");
  });
});
