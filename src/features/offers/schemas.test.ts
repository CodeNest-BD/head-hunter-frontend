import { describe, expect, it } from "vitest";
import { offerSchema } from "./schemas";

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
