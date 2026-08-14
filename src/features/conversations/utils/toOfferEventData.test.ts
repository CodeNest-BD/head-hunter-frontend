import { describe, expect, it } from "vitest";

import type { Offer } from "@/features/offers";
import { toOfferEventData } from "./toOfferEventData";

function offer(overrides: Partial<Offer> & { id: string }): Offer {
  return {
    candidateId: "cand-1",
    jobId: "job-1",
    previousOfferId: null,
    createdBy: "company",
    amountMinor: 500000,
    status: "sent",
    placementDetails: null,
    createdAt: "2026-08-10T09:00:00.000Z",
    ...overrides,
  };
}

describe("toOfferEventData", () => {
  it("maps a REST offer onto the shape OfferCard renders", () => {
    const mapped = toOfferEventData(
      offer({
        id: "offer-1",
        status: "countered",
        amountMinor: 10000,
        previousOfferId: "offer-0",
        createdBy: "recruiter",
        placementDetails: {
          salaryMinor: 1300000,
          jobTitle: "counter",
          startDate: "2026-08-19",
        },
      }),
    );

    expect(mapped).toEqual({
      kind: "offer",
      offerId: "offer-1",
      offerStatus: "countered",
      amountMinor: 10000,
      salaryMinor: 1300000,
      jobTitle: "counter",
      startDate: "2026-08-19",
      previousOfferId: "offer-0",
      createdBy: "recruiter",
    });
  });

  it("nulls the placement fields when the blob is absent", () => {
    const mapped = toOfferEventData(
      offer({ id: "offer-1", placementDetails: null }),
    );

    expect(mapped.salaryMinor).toBeNull();
    expect(mapped.jobTitle).toBeNull();
    expect(mapped.startDate).toBeNull();
  });

  it("nulls the placement fields when the blob is present but a key is absent", () => {
    const mapped = toOfferEventData(
      offer({ id: "offer-1", placementDetails: {} }),
    );

    expect(mapped.salaryMinor).toBeNull();
    expect(mapped.jobTitle).toBeNull();
    expect(mapped.startDate).toBeNull();
  });
});
