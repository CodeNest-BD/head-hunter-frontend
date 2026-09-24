import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/utils";
import type { Payout, PayoutAccount } from "../schemas";
import { PayoutTrackingDialog } from "./PayoutTrackingDialog";

const fetchPayoutAccountMock = vi.fn();

vi.mock("../api/billing", () => ({
  fetchPayoutAccount: (...args: unknown[]) => fetchPayoutAccountMock(...args),
}));

const verifiedAccount: PayoutAccount = {
  status: "verified",
  bankName: "Chase",
  bankLast4: "6789",
  disabledReason: null,
  needsIdentity: false,
  needsBank: false,
};

function payout(overrides: Partial<Payout> = {}): Payout {
  return {
    id: "7d1f3c9a-2b41-4a7e-9d10-1a2b3c4d5e6f",
    amountMinor: 250_000,
    status: "paid",
    failureReason: null,
    createdAt: "2026-09-14T14:05:00Z",
    paidAt: "2026-09-16T09:00:00Z",
    ...overrides,
  };
}

describe("PayoutTrackingDialog", () => {
  beforeEach(() => {
    fetchPayoutAccountMock.mockReset();
    fetchPayoutAccountMock.mockResolvedValue(verifiedAccount);
  });

  it("renders nothing while no payout is selected", () => {
    renderWithProviders(
      <PayoutTrackingDialog payout={null} onClose={vi.fn()} />,
    );
    expect(screen.queryByText("Withdrawal Details")).not.toBeInTheDocument();
  });

  it("shows the amount, destination, and completed timeline for a paid payout", async () => {
    renderWithProviders(
      <PayoutTrackingDialog payout={payout()} onClose={vi.fn()} />,
    );

    expect(screen.getByText("Withdrawal Details")).toBeInTheDocument();
    expect(screen.getByText("$2,500")).toBeInTheDocument();
    expect(screen.getByText("Requested")).toBeInTheDocument();
    expect(screen.getByText("Sent to Your Bank")).toBeInTheDocument();
    expect(screen.getByText("Paid Sep 16, 2026")).toBeInTheDocument();
    expect(screen.getByText("7D1F3C9A")).toBeInTheDocument();
    // The destination bank loads from the payout account query.
    expect(await screen.findByText("to Chase •••• 6789")).toBeInTheDocument();
  });

  it("shows the failure reason and restored-balance step for a failed payout", () => {
    renderWithProviders(
      <PayoutTrackingDialog
        payout={payout({
          status: "failed",
          paidAt: null,
          failureReason: "Account not found.",
        })}
        onClose={vi.fn()}
      />,
    );

    // "Failed" appears twice by design: the status badge and the step title.
    expect(screen.getAllByText("Failed")).toHaveLength(2);
    expect(screen.getByText("Account not found.")).toBeInTheDocument();
    expect(screen.getByText("Balance Restored")).toBeInTheDocument();
  });

  it("closes through the close button", async () => {
    const onClose = vi.fn();
    renderWithProviders(
      <PayoutTrackingDialog payout={payout()} onClose={onClose} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
