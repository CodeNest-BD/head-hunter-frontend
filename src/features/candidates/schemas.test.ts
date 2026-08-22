import { describe, expect, it } from "vitest";
import { candidateFormSchema } from "./schemas";

const valid = {
  fullName: "Jordan Rivera",
  email: "jordan@example.com",
  phone: "",
  overview: "",
  linkedinUrl: "",
  yearsOfExperience: "",
  currentCompany: "",
  expectedSalary: "",
  noticePeriodDays: "",
};

const errorPaths = (overrides: Record<string, unknown>): string[] => {
  const result = candidateFormSchema.safeParse({ ...valid, ...overrides });
  return result.success ? [] : result.error.issues.map((i) => i.path.join("."));
};

const errorMessages = (overrides: Record<string, unknown>): string[] => {
  const result = candidateFormSchema.safeParse({ ...valid, ...overrides });
  return result.success ? [] : result.error.issues.map((i) => i.message);
};

describe("candidateFormSchema", () => {
  it("accepts the minimum viable candidate", () => {
    expect(candidateFormSchema.safeParse(valid).success).toBe(true);
  });

  it("leaves expected salary optional", () => {
    expect(errorPaths({ expectedSalary: "" })).toEqual([]);
  });

  it("still rejects a negative expected salary", () => {
    expect(errorPaths({ expectedSalary: "-1" })).toContain("expectedSalary");
  });

  it("accepts an expected salary at the $10,000,000 plausibility ceiling", () => {
    expect(errorPaths({ expectedSalary: "10000000" })).toEqual([]);
  });

  it("rejects an expected salary over the $10,000,000 plausibility ceiling", () => {
    expect(errorMessages({ expectedSalary: "10000001" })).toContain(
      "Expected salary must be under $10,000,000",
    );
  });

  it("regression: rejects the exact incident value that overflowed the backend bigint column", () => {
    const messages = errorMessages({ expectedSalary: "500000000000000" });
    expect(messages).toContain("Expected salary must be under $10,000,000");
  });

  it("rejects an expected salary given in exponent notation past the ceiling", () => {
    expect(errorMessages({ expectedSalary: "1e20" })).toContain(
      "Expected salary must be under $10,000,000",
    );
  });
});
