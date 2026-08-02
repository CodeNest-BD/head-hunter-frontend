import { describe, expect, it } from "vitest";
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
});
