import { describe, expect, it } from "vitest";

import { US_STATES } from "@/shared/data/usStatesGeo";

import {
  bubbleRadius,
  feeRange,
  nextBubbleSelection,
  resolveCityBubbles,
  type MapSelection,
} from "./cityMapBubbles";

describe("resolveCityBubbles", () => {
  const hi = US_STATES.find((s) => s.code === "HI")!;
  const distanceFromHiCentroid = (b: { x: number; y: number }): number =>
    Math.hypot(b.x - hi.cx, b.y - hi.cy);

  it("places a city missing from the curated list at its state centroid", () => {
    // Kaunakakai is a real Census place the job form can pick, but it is not in
    // the hand-geocoded US_CITIES set — it must still get a bubble, not vanish.
    const bubbles = resolveCityBubbles([
      {
        locationState: "HI",
        locationCity: "Kaunakakai",
        openRoles: 2,
        totalFeeMinor: 298000,
      },
    ]);
    expect(bubbles).toHaveLength(1);
    expect(bubbles[0]).toMatchObject({
      city: "Kaunakakai",
      state: "HI",
      openRoles: 2,
      totalFeeMinor: 298000,
    });
    // Positioned at the state centroid (within the small fan-out offset).
    expect(distanceFromHiCentroid(bubbles[0])).toBeLessThanOrEqual(10);
  });

  it("still places a curated city at its own coordinate, not the centroid", () => {
    const [honolulu] = resolveCityBubbles([
      {
        locationState: "HI",
        locationCity: "Honolulu",
        openRoles: 1,
        totalFeeMinor: 100000,
      },
    ]);
    expect(honolulu.city).toBe("Honolulu");
    // Honolulu has a real geocode, so it is nowhere near the state centroid.
    expect(distanceFromHiCentroid(honolulu)).toBeGreaterThan(10);
  });

  it("merges duplicate rows of the same fallback city", () => {
    const bubbles = resolveCityBubbles([
      {
        locationState: "HI",
        locationCity: "Kaunakakai",
        openRoles: 2,
        totalFeeMinor: 200000,
      },
      {
        locationState: "HI",
        locationCity: "Kaunakakai",
        openRoles: 3,
        totalFeeMinor: 300000,
      },
    ]);
    expect(bubbles).toHaveLength(1);
    expect(bubbles[0]).toMatchObject({ openRoles: 5, totalFeeMinor: 500000 });
  });

  it("drops a row whose state is unknown", () => {
    expect(
      resolveCityBubbles([
        {
          locationState: "ZZ",
          locationCity: "Nowhere",
          openRoles: 1,
          totalFeeMinor: 1000,
        },
      ]),
    ).toEqual([]);
  });
});

describe("nextBubbleSelection", () => {
  const sanJose = { state: "CA", city: "San Jose" };

  it("selects the city when nothing is selected", () => {
    expect(nextBubbleSelection({ kind: "none" }, sanJose)).toEqual({
      kind: "city",
      state: "CA",
      city: "San Jose",
    });
  });

  it("drills into the city when its whole state is selected (the bug)", () => {
    // Previously this cleared the map; it must now select the city instead.
    const state: MapSelection = { kind: "state", state: "CA" };
    expect(nextBubbleSelection(state, sanJose)).toEqual({
      kind: "city",
      state: "CA",
      city: "San Jose",
    });
  });

  it("clears when the same city is clicked again", () => {
    const selected: MapSelection = {
      kind: "city",
      state: "CA",
      city: "San Jose",
    };
    expect(nextBubbleSelection(selected, sanJose)).toEqual({ kind: "none" });
  });

  it("switches to another city rather than clearing", () => {
    const oakland: MapSelection = {
      kind: "city",
      state: "CA",
      city: "Oakland",
    };
    expect(nextBubbleSelection(oakland, sanJose)).toEqual({
      kind: "city",
      state: "CA",
      city: "San Jose",
    });
  });

  it("treats same-named cities in different states as distinct", () => {
    const portlandOr: MapSelection = {
      kind: "city",
      state: "OR",
      city: "Portland",
    };
    expect(
      nextBubbleSelection(portlandOr, { state: "ME", city: "Portland" }),
    ).toEqual({ kind: "city", state: "ME", city: "Portland" });
  });
});

describe("feeRange", () => {
  it("finds the min and max available fee", () => {
    expect(
      feeRange([
        { totalFeeMinor: 300 },
        { totalFeeMinor: 100 },
        { totalFeeMinor: 900 },
      ]),
    ).toEqual({ min: 100, max: 900 });
  });

  it("is a zero range when there are no bubbles", () => {
    expect(feeRange([])).toEqual({ min: 0, max: 0 });
  });
});

describe("bubbleRadius", () => {
  const MIN = 10;
  const MAX = 32;

  it("maps the quietest to minRadius and the busiest to maxRadius", () => {
    expect(bubbleRadius(50_000, 50_000, 5_075_000, MIN, MAX)).toBe(MIN);
    expect(bubbleRadius(5_075_000, 50_000, 5_075_000, MIN, MAX)).toBe(MAX);
  });

  it("gives a clearly larger radius to $3,000 than $500 in a skewed spread", () => {
    // The real complaint: $500 and $3,000 must not look the same.
    const min = 50_000; // $500
    const max = 5_075_000; // $50,750 outlier
    const small = bubbleRadius(50_000, min, max, MIN, MAX); // $500
    const mid = bubbleRadius(300_000, min, max, MIN, MAX); // $3,000
    expect(small).toBe(MIN);
    expect(mid - small).toBeGreaterThan(4);
    expect(mid).toBeLessThan(MAX);
  });

  it("is monotonic — more available fee never shrinks the bubble", () => {
    const r = (v: number) => bubbleRadius(v, 50_000, 5_075_000, MIN, MAX);
    expect(r(100_000)).toBeGreaterThan(r(50_000));
    expect(r(300_000)).toBeGreaterThan(r(100_000));
    expect(r(5_075_000)).toBeGreaterThan(r(300_000));
  });

  it("uses the mid radius when every value is equal", () => {
    expect(bubbleRadius(700, 700, 700, MIN, MAX)).toBe((MIN + MAX) / 2);
  });
});
