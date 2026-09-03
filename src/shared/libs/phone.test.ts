import { describe, expect, it } from "vitest";

import { parseE164, phoneSchema, toE164 } from "./phone";

describe("parseE164", () => {
  it("splits a US E.164 number into its country and national digits", () => {
    expect(parseE164("+12025550100")).toEqual({
      country: "US",
      national: "2025550100",
    });
  });

  it("recognises a non-US country from the calling code", () => {
    expect(parseE164("+442079460958")).toEqual({
      country: "GB",
      national: "2079460958",
    });
  });

  it("falls back to the default country and bare digits for an unparseable value", () => {
    expect(parseE164("")).toEqual({ country: "US", national: "" });
    expect(parseE164("12345")).toEqual({ country: "US", national: "12345" });
  });
});

describe("toE164", () => {
  it("prefixes the country's calling code to the national digits", () => {
    expect(toE164("US", "2025550100")).toBe("+12025550100");
    expect(toE164("GB", "2079460958")).toBe("+442079460958");
  });

  it("strips punctuation from the national part", () => {
    expect(toE164("US", "(202) 555-0100")).toBe("+12025550100");
  });

  it("returns an empty string when there are no digits", () => {
    expect(toE164("US", "")).toBe("");
  });
});

describe("phoneSchema", () => {
  it("accepts valid numbers from any country", () => {
    expect(phoneSchema.safeParse("+12025550100").success).toBe(true);
    expect(phoneSchema.safeParse("+442079460958").success).toBe(true);
  });

  it("rejects a number with no country code or an impossible length", () => {
    expect(phoneSchema.safeParse("2025550100").success).toBe(false);
    expect(phoneSchema.safeParse("+1202555010").success).toBe(false);
    expect(phoneSchema.safeParse("").success).toBe(false);
  });
});
