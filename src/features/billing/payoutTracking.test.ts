import { describe, expect, it } from "vitest";

import {
  addBusinessDays,
  bankLabel,
  payoutReference,
  payoutTimeline,
} from "./payoutTracking";
import type { Payout, PayoutAccount } from "./schemas";

function payout(overrides: Partial<Payout> = {}): Payout {
  return {
    id: "7d1f3c9a-2b41-4a7e-9d10-1a2b3c4d5e6f",
    amountMinor: 250_000,
    status: "pending",
    failureReason: null,
    createdAt: "2026-09-21T14:05:00Z", // a Monday
    paidAt: null,
    ...overrides,
  };
}

function account(overrides: Partial<PayoutAccount> = {}): PayoutAccount {
  return {
    status: "verified",
    bankName: "Chase",
    bankLast4: "6789",
    disabledReason: null,
    needsIdentity: false,
    needsBank: false,
    ...overrides,
  };
}

describe("addBusinessDays", () => {
  it("counts only weekdays", () => {
    // Friday + 2 business days skips the weekend and lands on Tuesday.
    const friday = new Date(2026, 8, 18);
    expect(addBusinessDays(friday, 2).getDay()).toBe(2);
    expect(addBusinessDays(friday, 2).getDate()).toBe(22);
  });

  it("does not mutate the input date", () => {
    const start = new Date(2026, 8, 18);
    addBusinessDays(start, 3);
    expect(start.getDate()).toBe(18);
  });
});

describe("bankLabel", () => {
  it("shows bank name and last4 when both are known", () => {
    expect(bankLabel(account())).toBe("Chase •••• 6789");
  });

  it("falls back to a generic label without a bank name", () => {
    expect(bankLabel(account({ bankName: null }))).toBe(
      "Bank account •••• 6789",
    );
  });

  it("degrades to a connected note without last4", () => {
    expect(bankLabel(account({ bankName: null, bankLast4: null }))).toBe(
      "Bank account connected",
    );
  });
});

describe("payoutReference", () => {
  it("is the uppercased first id block", () => {
    expect(payoutReference(payout().id)).toBe("7D1F3C9A");
  });
});

describe("payoutTimeline", () => {
  it("marks a pending payout as being handed to the bank", () => {
    const steps = payoutTimeline(payout({ status: "pending" }));
    expect(steps.map((step) => step.state)).toEqual([
      "done",
      "current",
      "upcoming",
    ]);
    expect(steps[2].detail).toMatch(/^Expected /);
  });

  it("moves the current marker to arrival while processing", () => {
    const steps = payoutTimeline(payout({ status: "processing" }));
    expect(steps.map((step) => step.state)).toEqual([
      "done",
      "done",
      "current",
    ]);
  });

  it("completes every step for a paid payout, dated by paidAt", () => {
    const steps = payoutTimeline(
      payout({ status: "paid", paidAt: "2026-09-23T09:00:00Z" }),
    );
    expect(steps.every((step) => step.state === "done")).toBe(true);
    expect(steps[2].detail).toContain("Paid Sep 23, 2026");
  });

  it("shows the failure reason and the restored balance", () => {
    const steps = payoutTimeline(
      payout({ status: "failed", failureReason: "Account not found." }),
    );
    expect(steps[1]).toMatchObject({
      title: "Failed",
      detail: "Account not found.",
      state: "failed",
    });
    expect(steps[2].title).toBe("Balance Restored");
  });

  it("explains a canceled payout without a failure tone", () => {
    const steps = payoutTimeline(payout({ status: "canceled" }));
    expect(steps[1].state).toBe("canceled");
    expect(steps[2].title).toBe("Balance Restored");
  });
});
