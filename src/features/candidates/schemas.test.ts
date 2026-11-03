import { describe, expect, it } from "vitest";
import {
  candidateFormSchema,
  CANDIDATE_STATUSES,
  IN_PROCESS_CANDIDATE_STATUSES,
} from "./schemas";

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

describe("IN_PROCESS_CANDIDATE_STATUSES", () => {
  it("is every stage except the endings and a stopped submission", () => {
    // The recruiter dashboard counts "Candidates In Process" with this list
    // and links to the inbox filtered by the very same list, so a stage added
    // to CANDIDATE_STATUSES without a decision here would be silently
    // excluded from both. A hire is the finish line and a pass is the exit.
    const endings = CANDIDATE_STATUSES.filter(
      (status) =>
        !(IN_PROCESS_CANDIDATE_STATUSES as readonly string[]).includes(status),
    );

    // `declined` joins the two endings: the candidate is stopped until the
    // recruiter fixes and resubmits, so counting it as work in flight would
    // overstate a pipeline that is actually waiting on them. `pending_review`
    // stays in — that one is live work waiting on an admin.
    expect(endings).toEqual(["declined", "hired", "passed"]);
  });

  it("keeps an offered candidate in process — the offer can still be declined", () => {
    expect(IN_PROCESS_CANDIDATE_STATUSES).toContain("offered");
  });
});
