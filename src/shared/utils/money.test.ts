import { describe, expect, it } from "vitest";
import {
  formatMinor,
  MAX_MONEY_MAJOR,
  MAX_MONEY_MAJOR_LABEL,
  MAX_SALARY_MAJOR,
  MAX_SALARY_MAJOR_LABEL,
  majorInputToMinor,
  majorToMinor,
  minorToMajor,
  minorToMajorInput,
} from "./money";

describe("money conversions", () => {
  it("converts cents to dollars", () => {
    expect(minorToMajor(250000)).toBe(2500);
  });

  it("converts dollars to cents", () => {
    expect(majorToMinor(2500)).toBe(250000);
  });

  it("round-trips a value with cents without drift", () => {
    expect(minorToMajor(majorToMinor(1234.56))).toBe(1234.56);
  });

  it("rounds rather than producing a fractional cent", () => {
    expect(majorToMinor(10.005)).toBe(1001);
    expect(Number.isInteger(majorToMinor(0.1 + 0.2))).toBe(true);
  });
});

describe("majorInputToMinor", () => {
  it("returns null for an empty field so the API clears the value", () => {
    expect(majorInputToMinor("")).toBeNull();
    expect(majorInputToMinor("   ")).toBeNull();
  });

  it("parses a plain number", () => {
    expect(majorInputToMinor("3000")).toBe(300000);
  });

  it("returns null for text that is not a number", () => {
    expect(majorInputToMinor("lots")).toBeNull();
  });

  it("keeps zero distinct from empty, which is the whole point", () => {
    expect(majorInputToMinor("0")).toBe(0);
    expect(majorInputToMinor("")).toBeNull();
  });
});

describe("minorToMajorInput", () => {
  it("renders null as an empty field", () => {
    expect(minorToMajorInput(null)).toBe("");
    expect(minorToMajorInput(undefined)).toBe("");
  });

  it("renders a value as its major-unit string", () => {
    expect(minorToMajorInput(300000)).toBe("3000");
  });
});

describe("formatMinor", () => {
  it("formats whole dollars without cents", () => {
    expect(formatMinor(300000)).toBe("$3,000");
  });

  it("shows cents when they are non-zero", () => {
    expect(formatMinor(123456)).toBe("$1,234.56");
  });

  it("renders a missing amount as a dash", () => {
    expect(formatMinor(null)).toBe("—");
  });
});

describe("money bounds", () => {
  it("labels the $1B hard safety ceiling to match the backend's own wording", () => {
    expect(MAX_MONEY_MAJOR).toBe(1_000_000_000);
    expect(MAX_MONEY_MAJOR_LABEL).toBe("$1,000,000,000");
  });

  it("labels the $10M salary plausibility ceiling", () => {
    expect(MAX_SALARY_MAJOR).toBe(10_000_000);
    expect(MAX_SALARY_MAJOR_LABEL).toBe("$10,000,000");
  });
});
