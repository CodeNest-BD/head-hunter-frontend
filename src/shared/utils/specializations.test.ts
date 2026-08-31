import { describe, expect, it } from "vitest";
import {
  MAX_SPECIALIZATIONS,
  MAX_SPECIALIZATION_LENGTH,
  findSuggestionValue,
  getSpecializationLabel,
  normalizeSpecialization,
  specializationsSchema,
} from "./specializations";

describe("normalizeSpecialization", () => {
  it("trims leading and trailing whitespace", () => {
    expect(normalizeSpecialization("  Technology  ")).toBe("Technology");
  });

  it("collapses runs of internal whitespace to a single space", () => {
    expect(normalizeSpecialization("Human   resources")).toBe(
      "Human resources",
    );
  });

  it("preserves casing and punctuation of a custom entry", () => {
    expect(normalizeSpecialization("Renewable energy")).toBe(
      "Renewable energy",
    );
    expect(normalizeSpecialization("AI & Robotics")).toBe("AI & Robotics");
  });
});

describe("getSpecializationLabel", () => {
  it("renders a known curated slug as its label", () => {
    expect(getSpecializationLabel("human_resources")).toBe("Human Resources");
    expect(getSpecializationLabel("logistics_supply_chain")).toBe(
      "Logistics & Supply Chain",
    );
  });

  it("passes an unrecognized value through unchanged, casing and punctuation intact", () => {
    expect(getSpecializationLabel("Renewable energy")).toBe("Renewable energy");
    expect(getSpecializationLabel("AI & Robotics")).toBe("AI & Robotics");
  });
});

describe("findSuggestionValue", () => {
  it("matches a slug against itself", () => {
    expect(findSuggestionValue("human_resources")).toBe("human_resources");
  });

  it("matches a typed label to its slug case-insensitively", () => {
    expect(findSuggestionValue("Human resources")).toBe("human_resources");
    expect(findSuggestionValue("HUMAN RESOURCES")).toBe("human_resources");
  });

  it("treats underscores and spaces as equivalent separators", () => {
    expect(findSuggestionValue("human resources")).toBe("human_resources");
    expect(findSuggestionValue("Skilled-Trades")).toBe("skilled_trades");
  });

  it("returns undefined for a value that matches no suggestion", () => {
    expect(findSuggestionValue("Renewable energy")).toBeUndefined();
  });
});

describe("specializationsSchema", () => {
  it("accepts an empty list", () => {
    expect(specializationsSchema.safeParse([]).success).toBe(true);
  });

  it("accepts up to the maximum number of entries", () => {
    const entries = Array.from(
      { length: MAX_SPECIALIZATIONS },
      (_, i) => `Specialization ${i}`,
    );
    expect(specializationsSchema.safeParse(entries).success).toBe(true);
  });

  it("rejects more than the maximum number of entries", () => {
    const entries = Array.from(
      { length: MAX_SPECIALIZATIONS + 1 },
      (_, i) => `Specialization ${i}`,
    );
    expect(specializationsSchema.safeParse(entries).success).toBe(false);
  });

  it("rejects an empty entry", () => {
    expect(specializationsSchema.safeParse(["Technology", ""]).success).toBe(
      false,
    );
    expect(specializationsSchema.safeParse(["   "]).success).toBe(false);
  });

  it(`rejects an entry longer than ${MAX_SPECIALIZATION_LENGTH} characters`, () => {
    const tooLong = "a".repeat(MAX_SPECIALIZATION_LENGTH + 1);
    expect(specializationsSchema.safeParse([tooLong]).success).toBe(false);
  });

  it(`accepts an entry exactly ${MAX_SPECIALIZATION_LENGTH} characters long`, () => {
    const atLimit = "a".repeat(MAX_SPECIALIZATION_LENGTH);
    expect(specializationsSchema.safeParse([atLimit]).success).toBe(true);
  });

  it("rejects case-insensitive duplicates", () => {
    const result = specializationsSchema.safeParse([
      "Technology",
      "technology",
    ]);
    expect(result.success).toBe(false);
  });

  it("rejects a slug and its label as duplicates once separators are normalized", () => {
    const result = specializationsSchema.safeParse([
      "human_resources",
      "Human resources",
    ]);
    expect(result.success).toBe(false);
  });

  it("accepts distinct entries", () => {
    expect(
      specializationsSchema.safeParse(["technology", "Finance"]).success,
    ).toBe(true);
  });
});
