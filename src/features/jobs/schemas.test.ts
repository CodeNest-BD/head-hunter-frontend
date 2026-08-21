import { describe, expect, it } from "vitest";
import { jobFormSchema } from "./schemas";

const valid = {
  title: "Senior Software Engineer",
  description: "<p>We are hiring a senior engineer.</p>",
  roleCategory: "engineering" as const,
  employmentType: "full_time" as const,
  locationState: "CA",
  locationCity: "",
  isRemote: false,
  salaryMin: "",
  salaryMax: "",
  recruiterFee: "10000",
};

const errorPaths = (overrides: Record<string, unknown>): string[] => {
  const result = jobFormSchema.safeParse({ ...valid, ...overrides });
  return result.success ? [] : result.error.issues.map((i) => i.path.join("."));
};

describe("jobFormSchema", () => {
  it("accepts the minimum viable job", () => {
    expect(jobFormSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an empty title", () => {
    expect(errorPaths({ title: "   " })).toContain("title");
  });

  it("rejects a missing recruiter fee", () => {
    expect(errorPaths({ recruiterFee: "" })).toContain("recruiterFee");
  });

  it("rejects a negative recruiter fee", () => {
    expect(errorPaths({ recruiterFee: "-5" })).toContain("recruiterFee");
  });

  it("rejects a state code that is not two characters", () => {
    expect(errorPaths({ locationState: "CAL" })).toContain("locationState");
  });

  it("requires a state, because the job map skips rows without one", () => {
    expect(errorPaths({ locationState: "" })).toContain("locationState");
  });

  it("requires a description, which is what recruiters read before pitching", () => {
    expect(errorPaths({ description: "   " })).toContain("description");
  });

  it("requires an employment type", () => {
    expect(errorPaths({ employmentType: "" })).toContain("employmentType");
  });

  it("leaves the salary band optional", () => {
    expect(errorPaths({ salaryMin: "", salaryMax: "" })).toEqual([]);
  });

  it("leaves the city optional", () => {
    expect(errorPaths({ locationCity: "" })).toEqual([]);
  });

  it("rejects a salary maximum below the minimum", () => {
    expect(errorPaths({ salaryMin: "200000", salaryMax: "100000" })).toContain(
      "salaryMax",
    );
  });

  it("accepts a salary range with only one bound set", () => {
    expect(errorPaths({ salaryMin: "100000", salaryMax: "" })).toEqual([]);
  });

  it("rejects a role category outside the enum", () => {
    expect(errorPaths({ roleCategory: "wizardry" })).toContain("roleCategory");
  });
});
