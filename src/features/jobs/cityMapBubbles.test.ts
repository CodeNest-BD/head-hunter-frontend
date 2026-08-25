import { describe, expect, it } from "vitest";

import { bubbleRadius, feeRange } from "./cityMapBubbles";

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
