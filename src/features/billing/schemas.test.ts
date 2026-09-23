import { describe, expect, it } from "vitest";

import {
  payoutAccountSchema,
  payoutSchema,
  recruiterWalletSummarySchema,
} from "./schemas";

const walletFromCurrentBackend = {
  totalMinor: 6_140_000,
  releasedMinor: 3_215_000,
  earnedYtdMinor: 6_140_000,
  inEscrowMinor: 2_275_000,
  inDisputeMinor: 650_000,
  placementsCount: 11,
  nextReleaseAt: "2026-10-16T00:00:00.000Z",
};

describe("recruiterWalletSummarySchema", () => {
  it("parses a wallet from the pre-payout backend, leaving the payout fields unknown", () => {
    const parsed = recruiterWalletSummarySchema.parse(walletFromCurrentBackend);
    // Deliberately NOT defaulted from releasedMinor: an absent figure must
    // read as "unknown" (withdrawing locked), never as an available balance.
    expect(parsed.availableMinor).toBeUndefined();
    expect(parsed.pendingPayoutMinor).toBeUndefined();
  });

  it("passes backend-reported payout fields through", () => {
    const parsed = recruiterWalletSummarySchema.parse({
      ...walletFromCurrentBackend,
      availableMinor: 1_000_00,
      pendingPayoutMinor: 500_00,
    });
    expect(parsed.availableMinor).toBe(1_000_00);
    expect(parsed.pendingPayoutMinor).toBe(500_00);
  });
});

describe("payoutAccountSchema", () => {
  it("parses every account state", () => {
    for (const status of [
      "none",
      "onboarding",
      "pending_verification",
      "verified",
      "restricted",
    ] as const) {
      const parsed = payoutAccountSchema.parse({
        status,
        bankName: status === "verified" ? "Chase" : null,
        bankLast4: status === "verified" ? "4821" : null,
        disabledReason: status === "restricted" ? "More info required" : null,
      });
      expect(parsed.status).toBe(status);
    }
  });

  it("rejects unknown states so a contract drift fails loudly", () => {
    expect(() =>
      payoutAccountSchema.parse({
        status: "suspended",
        bankName: null,
        bankLast4: null,
        disabledReason: null,
      }),
    ).toThrow();
  });
});

describe("payoutSchema", () => {
  it("parses a paid payout", () => {
    const parsed = payoutSchema.parse({
      id: "po_1",
      amountMinor: 150_000,
      status: "paid",
      failureReason: null,
      createdAt: "2026-09-20T10:00:00.000Z",
      paidAt: "2026-09-22T10:00:00.000Z",
    });
    expect(parsed.status).toBe("paid");
    expect(parsed.paidAt).not.toBeNull();
  });
});
