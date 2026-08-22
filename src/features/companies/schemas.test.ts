import { describe, expect, it } from "vitest";
import { MAX_MONEY_MAJOR, MAX_MONEY_MAJOR_LABEL } from "@/shared/utils/money";
import { companyProfileFormSchema } from "./schemas";

const valid = {
  companyName: "Acme Inc.",
  website: "",
  description: "",
  commissionMin: "",
  commissionMax: "",
};

const errorPaths = (overrides: Record<string, unknown>): string[] => {
  const result = companyProfileFormSchema.safeParse({ ...valid, ...overrides });
  return result.success ? [] : result.error.issues.map((i) => i.path.join("."));
};

describe("companyProfileFormSchema", () => {
  it("accepts a profile with only a name", () => {
    expect(companyProfileFormSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a blank company name", () => {
    expect(errorPaths({ companyName: "   " })).toContain("companyName");
  });

  it("accepts an empty website, which means unset", () => {
    expect(errorPaths({ website: "" })).toEqual([]);
  });

  it("rejects a website that is not a URL", () => {
    expect(errorPaths({ website: "acme" })).toContain("website");
  });

  it("rejects a commission maximum below the minimum", () => {
    expect(
      errorPaths({ commissionMin: "20000", commissionMax: "3000" }),
    ).toContain("commissionMax");
  });

  it("accepts a commission range with only one bound set", () => {
    expect(errorPaths({ commissionMin: "3000", commissionMax: "" })).toEqual(
      [],
    );
  });

  it("accepts equal bounds", () => {
    expect(
      errorPaths({ commissionMin: "5000", commissionMax: "5000" }),
    ).toEqual([]);
  });

  it("rejects a commission beyond the platform ceiling, on either end", () => {
    const beyond = String(MAX_MONEY_MAJOR + 1);

    expect(errorPaths({ commissionMin: beyond })).toContain("commissionMin");
    expect(errorPaths({ commissionMax: beyond })).toContain("commissionMax");
  });

  it("rejects a commission that is not a number", () => {
    expect(errorPaths({ commissionMin: "a lot" })).toContain("commissionMin");
  });

  it("says how much is too much in words, not in minor units", () => {
    const result = companyProfileFormSchema.safeParse({
      ...valid,
      commissionMax: String(MAX_MONEY_MAJOR + 1),
    });

    expect(result.success).toBe(false);
    const message = result.success ? "" : result.error.issues[0].message;
    expect(message).toBe(`Commission must be under ${MAX_MONEY_MAJOR_LABEL}`);
  });
});
