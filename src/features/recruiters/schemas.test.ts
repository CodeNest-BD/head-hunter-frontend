import { describe, expect, it } from "vitest";

import { recruiterProfileFormSchema } from "./schemas";

const valid = {
  addressLine: "12 Baker Street",
  city: "Austin",
  state: "TX",
  zip: "78701",
  linkedinUrl: "",
  phone: "+12025550100",
  experiences: [],
};

const firm = (overrides: Record<string, unknown> = {}) => ({
  firmName: "Robert Half",
  years: "5",
  specializations: ["technology"],
  ...overrides,
});

const errorPaths = (overrides: Record<string, unknown>): string[] => {
  const result = recruiterProfileFormSchema.safeParse({
    ...valid,
    ...overrides,
  });
  return result.success ? [] : result.error.issues.map((i) => i.path.join("."));
};

describe("recruiterProfileFormSchema", () => {
  it("accepts a profile with only the fields sign-up required", () => {
    expect(recruiterProfileFormSchema.safeParse(valid).success).toBe(true);
  });

  // Both are required at sign-up, so the profile screen must not be a way to
  // blank them back out.
  it("refuses to blank the address or the phone", () => {
    expect(errorPaths({ addressLine: "  " })).toContain("addressLine");
    expect(errorPaths({ city: "" })).toContain("city");
    expect(errorPaths({ state: "" })).toContain("state");
    expect(errorPaths({ zip: "" })).toContain("zip");
    expect(errorPaths({ phone: "" })).toContain("phone");
  });

  it("accepts a list of staffing firms", () => {
    expect(
      errorPaths({ experiences: [firm(), firm({ firmName: "Aerotek" })] }),
    ).toEqual([]);
  });

  it("accepts exactly five firms and rejects a sixth", () => {
    expect(errorPaths({ experiences: Array(5).fill(firm()) })).toEqual([]);
    expect(errorPaths({ experiences: Array(6).fill(firm()) })).toContain(
      "experiences",
    );
  });

  it("requires a firm name", () => {
    expect(errorPaths({ experiences: [firm({ firmName: "  " })] })).toContain(
      "experiences.0.firmName",
    );
  });

  // Blank is not "unset" here: a firm the user added has to say how long.
  it("requires years on a firm that was added", () => {
    expect(errorPaths({ experiences: [firm({ years: "" })] })).toContain(
      "experiences.0.years",
    );
  });

  it("rejects implausible or non-numeric years", () => {
    expect(errorPaths({ experiences: [firm({ years: "81" })] })).toContain(
      "experiences.0.years",
    );
    expect(errorPaths({ experiences: [firm({ years: "abc" })] })).toContain(
      "experiences.0.years",
    );
    expect(errorPaths({ experiences: [firm({ years: "2.5" })] })).toContain(
      "experiences.0.years",
    );
  });

  it("accepts a firm with no specializations chosen", () => {
    expect(
      errorPaths({ experiences: [firm({ specializations: [] })] }),
    ).toEqual([]);
  });

  it("rejects a LinkedIn value that is not a URL", () => {
    expect(errorPaths({ linkedinUrl: "dana-whitfield" })).toContain(
      "linkedinUrl",
    );
  });

  it("rejects a state that is not a two-letter code", () => {
    expect(errorPaths({ state: "Texas" })).toContain("state");
  });
});
