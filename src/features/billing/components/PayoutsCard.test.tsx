import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/utils";
import type { PayoutAccount, RecruiterWalletSummary } from "../schemas";
import { PayoutsCard } from "./PayoutsCard";

const fetchPayoutAccountMock = vi.fn();
const createPayoutOnboardingMock = vi.fn();
const createPayoutMock = vi.fn();

vi.mock("../api/billing", () => ({
  fetchPayoutAccount: (...args: unknown[]) => fetchPayoutAccountMock(...args),
  createPayoutOnboarding: (...args: unknown[]) =>
    createPayoutOnboardingMock(...args),
  createPayout: (...args: unknown[]) => createPayoutMock(...args),
}));

function account(overrides: Partial<PayoutAccount> = {}): PayoutAccount {
  return {
    status: "none",
    bankName: null,
    bankLast4: null,
    disabledReason: null,
    ...overrides,
  };
}

function wallet(
  overrides: Partial<RecruiterWalletSummary> = {},
): RecruiterWalletSummary {
  return {
    totalMinor: 6_140_000,
    releasedMinor: 3_215_000,
    earnedYtdMinor: 6_140_000,
    inEscrowMinor: 2_275_000,
    inDisputeMinor: 650_000,
    placementsCount: 11,
    nextReleaseAt: null,
    availableMinor: 3_215_000,
    pendingPayoutMinor: 0,
    ...overrides,
  };
}

describe("PayoutsCard", () => {
  beforeEach(() => {
    fetchPayoutAccountMock.mockReset();
    createPayoutOnboardingMock.mockReset();
    createPayoutMock.mockReset();
  });

  it("offers setup when no payout account exists", async () => {
    fetchPayoutAccountMock.mockResolvedValue(account());
    renderWithProviders(<PayoutsCard wallet={wallet()} />);

    expect(
      await screen.findByRole("button", { name: "Set up payouts" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Withdraw" }),
    ).not.toBeInTheDocument();
  });

  it("resumes unfinished onboarding", async () => {
    fetchPayoutAccountMock.mockResolvedValue(account({ status: "onboarding" }));
    renderWithProviders(<PayoutsCard wallet={wallet()} />);

    expect(
      await screen.findByRole("button", { name: "Resume setup" }),
    ).toBeInTheDocument();
  });

  it("surfaces Stripe's reason when the account is restricted", async () => {
    fetchPayoutAccountMock.mockResolvedValue(
      account({
        status: "restricted",
        disabledReason: "Additional identity document required.",
      }),
    );
    renderWithProviders(<PayoutsCard wallet={wallet()} />);

    expect(
      await screen.findByText("Additional identity document required."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Fix on Stripe" }),
    ).toBeInTheDocument();
  });

  it("shows the bank and enables withdrawing once verified", async () => {
    fetchPayoutAccountMock.mockResolvedValue(
      account({ status: "verified", bankName: "Chase", bankLast4: "4821" }),
    );
    renderWithProviders(<PayoutsCard wallet={wallet()} />);

    expect(await screen.findByText("Chase •••• 4821")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Withdraw" })).toBeEnabled();
  });

  it("disables withdrawing below the minimum balance", async () => {
    fetchPayoutAccountMock.mockResolvedValue(
      account({ status: "verified", bankName: "Chase", bankLast4: "4821" }),
    );
    renderWithProviders(
      <PayoutsCard wallet={wallet({ availableMinor: 2_500 })} />,
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Withdraw" })).toBeDisabled(),
    );
    expect(screen.getByRole("button", { name: "Withdraw" })).toHaveAttribute(
      "title",
      "Withdrawing unlocks at $50 available.",
    );
  });

  it("disables withdrawing while the balance is unknown, without the below-minimum hint", async () => {
    fetchPayoutAccountMock.mockResolvedValue(
      account({ status: "verified", bankName: "Chase", bankLast4: "4821" }),
    );
    // No wallet: still loading or failed — a load hiccup must not read as
    // "your balance is below the minimum".
    renderWithProviders(<PayoutsCard wallet={undefined} />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Withdraw" })).toBeDisabled(),
    );
    expect(
      screen.getByRole("button", { name: "Withdraw" }),
    ).not.toHaveAttribute("title");
  });
});
