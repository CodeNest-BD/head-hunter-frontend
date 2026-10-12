import { describe, expect, it, vi, afterEach } from "vitest";

import {
  countdown,
  holdSummary,
  walletBeforeAfter,
  walletEffect,
} from "./financeFacts";
import type { AdminPayment, AdminPayout } from "../schemas";

const payment = (over: Partial<AdminPayment>): AdminPayment => ({
  id: "p1",
  source: "ledger",
  serialNumber: 88431,
  companyProfileId: "c1",
  companyUserId: "cu1",
  companySerialNumber: 3,
  companyName: "Northwind Labs",
  entryType: "credit",
  amountMinor: 2_000_000,
  balanceDeltaMinor: 2_000_000,
  reservedDeltaMinor: 0,
  balanceAfterMinor: 6_700_000,
  reservedAfterMinor: 3_900_000,
  referenceType: "topup",
  referenceId: null,
  referenceSerialNumber: null,
  referenceLabel: null,
  description: null,
  status: "succeeded",
  providerRef: "PRV-7Q2K91",
  createdAt: "2026-10-09T10:05:00.000Z",
  ...over,
});

const payout = (over: Partial<AdminPayout>): AdminPayout => ({
  placementId: "pl1",
  placementSerialNumber: 3327,
  view: "on_hold",
  placementStatus: "held",
  recruiterProfileId: "r1",
  recruiterUserId: "ru1",
  recruiterSerialNumber: 7,
  recruiterName: "Kenji Mori",
  companyProfileId: "c1",
  companyUserId: "cu1",
  companySerialNumber: 3,
  companyName: "Quarry & Pine Studio",
  candidateId: "cand1",
  candidateSerialNumber: 12,
  candidateName: "Grace Li",
  jobId: "j1",
  jobSerialNumber: 2214,
  jobTitle: "Brand Designer",
  commissionMinor: 500_000,
  joiningDate: "2026-09-11",
  eligibleAt: "2026-10-11T00:00:00.000Z",
  releasedAt: null,
  openDisputeId: null,
  openDisputeSerialNumber: null,
  manualHoldCount: 0,
  ...over,
});

describe("walletEffect", () => {
  it("reports a failed row as having changed nothing", () => {
    expect(
      walletEffect(
        payment({
          status: "failed",
          balanceDeltaMinor: 0,
          reservedDeltaMinor: 0,
        }),
      ).label,
    ).toBe("No change");
  });

  it("reports a pending deposit as waiting on the provider", () => {
    expect(
      walletEffect(
        payment({
          status: "pending",
          balanceDeltaMinor: 0,
          reservedDeltaMinor: 0,
        }),
      ).label,
    ).toBe("On confirmation");
  });

  it("names the direction when money only moves between buckets", () => {
    expect(
      walletEffect(
        payment({ balanceDeltaMinor: 0, reservedDeltaMinor: 800_000 }),
      ).label,
    ).toBe("Available → Reserved");
    expect(
      walletEffect(
        payment({ balanceDeltaMinor: 0, reservedDeltaMinor: -400_000 }),
      ).label,
    ).toBe("Reserved → Available");
  });

  it("says a settled fee left the wallet entirely", () => {
    expect(
      walletEffect(
        payment({ balanceDeltaMinor: -500_000, reservedDeltaMinor: -500_000 }),
      ).label,
    ).toBe("−$5,000 settled");
  });

  it("gives the amount when a deposit lands", () => {
    expect(walletEffect(payment({})).label).toBe("+$20,000 available");
  });
});

describe("walletBeforeAfter", () => {
  it("works the before-balances back out of the after-balances", () => {
    expect(
      walletBeforeAfter(
        payment({
          balanceDeltaMinor: 0,
          reservedDeltaMinor: 800_000,
          balanceAfterMinor: 6_700_000,
          reservedAfterMinor: 3_900_000,
        }),
      ),
    ).toEqual({
      availableBefore: 3_600_000,
      availableAfter: 2_800_000,
      reservedBefore: 3_100_000,
      reservedAfter: 3_900_000,
    });
  });

  it("reports nothing for a row that never reached a wallet", () => {
    expect(
      walletBeforeAfter(
        payment({ balanceAfterMinor: null, reservedAfterMinor: null }),
      ),
    ).toBeNull();
  });
});

describe("countdown", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const at = (now: string, target: string) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(now));
    return countdown(target);
  };

  it("names today and tomorrow rather than counting them", () => {
    expect(at("2026-10-09T12:00:00", "2026-10-09T00:00:00").label).toBe(
      "Today",
    );
    expect(at("2026-10-09T12:00:00", "2026-10-10T00:00:00").label).toBe(
      "Tomorrow",
    );
  });

  it("counts forward to a date still ahead", () => {
    expect(at("2026-10-09T12:00:00", "2026-10-11T00:00:00")).toEqual({
      label: "In 2 days",
      overdue: false,
    });
  });

  it("marks a date already past as overdue and says how long", () => {
    expect(at("2026-10-09T12:00:00", "2026-10-05T00:00:00")).toEqual({
      label: "4 days ago",
      overdue: true,
    });
  });
});

describe("holdSummary", () => {
  it("reports nothing when nothing is holding the commission", () => {
    expect(holdSummary(payout({}))).toBeNull();
  });

  it("sends a dispute hold to the case that will clear it", () => {
    expect(
      holdSummary(
        payout({ openDisputeId: "d1", openDisputeSerialNumber: 1033 }),
      ),
    ).toEqual({
      label: "Dispute DSP-1033",
      detail: "Clears when resolved",
      href: "/admin/disputes/1033",
    });
  });

  it("counts the dispute alongside manual holds, and sends both to the payout", () => {
    expect(
      holdSummary(
        payout({
          openDisputeId: "d1",
          openDisputeSerialNumber: 1035,
          manualHoldCount: 1,
        }),
      ),
    ).toEqual({
      label: "2 holds",
      detail: "DSP-1035 + manual",
      href: "/admin/payouts/3327",
    });
  });

  it("sends a manual hold to the payout page, the only place it can be lifted", () => {
    expect(holdSummary(payout({ manualHoldCount: 2 }))?.href).toBe(
      "/admin/payouts/3327",
    );
  });

  it("reports manual holds on their own", () => {
    expect(holdSummary(payout({ manualHoldCount: 1 }))?.label).toBe(
      "Manual hold",
    );
    expect(holdSummary(payout({ manualHoldCount: 3 }))?.label).toBe(
      "3 manual holds",
    );
  });
});
