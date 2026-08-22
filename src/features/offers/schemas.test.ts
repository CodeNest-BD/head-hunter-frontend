import { describe, expect, it } from "vitest";
import { offerSchema, sendOfferFormSchema } from "./schemas";

const offer = {
  id: "11111111-1111-4111-8111-111111111111",
  candidateId: "22222222-2222-4222-8222-222222222222",
  jobId: "33333333-3333-4333-8333-333333333333",
  previousOfferId: null,
  createdBy: "company",
  amountMinor: 500000,
  status: "sent",
  placementDetails: null,
  createdAt: "2026-08-11T09:00:00.000Z",
};

describe("offerSchema", () => {
  it("parses a freshly sent offer with no predecessor or placement details yet", () => {
    const parsed = offerSchema.parse(offer);
    expect(parsed.previousOfferId).toBeNull();
    expect(parsed.placementDetails).toBeNull();
    expect(parsed.status).toBe("sent");
  });

  it("parses a counter-offer with its predecessor and agreed placement details", () => {
    const parsed = offerSchema.parse({
      ...offer,
      previousOfferId: "11111111-1111-4111-8111-111111111111",
      createdBy: "recruiter",
      status: "countered",
      placementDetails: {
        jobTitle: "Staff Engineer",
        salaryMinor: 13000000,
        startDate: "2026-09-01",
        notes: "Relocation covered.",
      },
    });
    expect(parsed.previousOfferId).toBe("11111111-1111-4111-8111-111111111111");
    expect(parsed.placementDetails?.salaryMinor).toBe(13000000);
  });

  it("rejects an unrecognised status rather than guessing at it", () => {
    const parsed = offerSchema.safeParse({ ...offer, status: "expired" });
    expect(parsed.success).toBe(false);
  });
});

const sendOfferForm = {
  salary: "150000",
  startDate: "",
  notes: "",
};

const sendOfferErrorMessages = (
  overrides: Record<string, unknown>,
): string[] => {
  const result = sendOfferFormSchema.safeParse({ ...sendOfferForm, ...overrides });
  return result.success ? [] : result.error.issues.map((i) => i.message);
};

describe("sendOfferFormSchema", () => {
  it("accepts a plain positive salary", () => {
    expect(sendOfferFormSchema.safeParse(sendOfferForm).success).toBe(true);
  });

  it("still rejects a salary of 0 or below", () => {
    expect(sendOfferErrorMessages({ salary: "0" })).toContain(
      "Enter a salary greater than 0",
    );
  });

  it("accepts a salary at the $1,000,000,000 ceiling", () => {
    expect(sendOfferErrorMessages({ salary: "1000000000" })).toEqual([]);
  });

  it("rejects a salary over the $1,000,000,000 ceiling", () => {
    expect(sendOfferErrorMessages({ salary: "1000000001" })).toContain(
      "Salary must be under $1,000,000,000",
    );
  });

  it("rejects a salary given in exponent notation past the ceiling", () => {
    expect(sendOfferErrorMessages({ salary: "1e20" })).toContain(
      "Salary must be under $1,000,000,000",
    );
  });
});
