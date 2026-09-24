import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/utils";
import type { PayoutAccount, RecruiterWalletSummary } from "../schemas";
import { PayoutsCard } from "./PayoutsCard";

const fetchPayoutAccountMock = vi.fn();
const submitPayoutIdentityMock = vi.fn();
const submitPayoutBankMock = vi.fn();
const createPayoutMock = vi.fn();

vi.mock("../api/billing", () => ({
  fetchPayoutAccount: (...args: unknown[]) => fetchPayoutAccountMock(...args),
  submitPayoutIdentity: (...args: unknown[]) =>
    submitPayoutIdentityMock(...args),
  submitPayoutBank: (...args: unknown[]) => submitPayoutBankMock(...args),
  createPayout: (...args: unknown[]) => createPayoutMock(...args),
}));

vi.mock("@/features/auth", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      email: "dana@example.com",
      firstName: "Dana",
      lastName: "Whitfield",
      phone: "+16145550177",
      role: "recruiter",
      emailVerified: true,
      profile: null,
    },
  }),
}));

function account(overrides: Partial<PayoutAccount> = {}): PayoutAccount {
  return {
    status: "none",
    bankName: null,
    bankLast4: null,
    disabledReason: null,
    needsIdentity: true,
    needsBank: true,
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
    submitPayoutIdentityMock.mockReset();
    submitPayoutBankMock.mockReset();
    createPayoutMock.mockReset();
  });

  it("offers in-app bank setup when no payout account exists", async () => {
    fetchPayoutAccountMock.mockResolvedValue(account());
    renderWithProviders(<PayoutsCard wallet={wallet()} />);

    expect(
      await screen.findByRole("button", { name: "Add bank account" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Withdraw" }),
    ).not.toBeInTheDocument();
  });

  it("opens the setup dialog on the identity step", async () => {
    const user = userEvent.setup();
    fetchPayoutAccountMock.mockResolvedValue(account());
    renderWithProviders(<PayoutsCard wallet={wallet()} />);

    await user.click(
      await screen.findByRole("button", { name: "Add bank account" }),
    );

    expect(screen.getByText("Set Up Payouts")).toBeInTheDocument();
    // Prefilled from the session user.
    expect(screen.getByLabelText("Legal first name")).toHaveValue("Dana");
    expect(screen.getByLabelText("Last 4 digits of SSN")).toBeInTheDocument();
  });

  it("resumes at the bank step when identity is already on file", async () => {
    const user = userEvent.setup();
    fetchPayoutAccountMock.mockResolvedValue(
      account({ status: "onboarding", needsIdentity: false, needsBank: true }),
    );
    renderWithProviders(<PayoutsCard wallet={wallet()} />);

    await user.click(
      await screen.findByRole("button", { name: "Continue setup" }),
    );

    expect(screen.getByLabelText("Routing number")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Last 4 digits of SSN"),
    ).not.toBeInTheDocument();
  });

  it("shows the verifying state with an edit affordance", async () => {
    fetchPayoutAccountMock.mockResolvedValue(
      account({
        status: "pending_verification",
        needsIdentity: false,
        needsBank: false,
        bankName: "Chase",
        bankLast4: "4821",
      }),
    );
    renderWithProviders(<PayoutsCard wallet={wallet()} />);

    expect(
      await screen.findByText("Verifying your details"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Edit details" }),
    ).toBeInTheDocument();
  });

  it("surfaces the restriction reason when payouts are paused", async () => {
    fetchPayoutAccountMock.mockResolvedValue(
      account({
        status: "restricted",
        needsIdentity: false,
        needsBank: false,
        disabledReason: "Additional identity document required.",
      }),
    );
    renderWithProviders(<PayoutsCard wallet={wallet()} />);

    expect(
      await screen.findByText("Additional identity document required."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Update details" }),
    ).toBeInTheDocument();
  });

  it("shows the bank and enables withdrawing once verified", async () => {
    fetchPayoutAccountMock.mockResolvedValue(
      account({
        status: "verified",
        needsIdentity: false,
        needsBank: false,
        bankName: "Chase",
        bankLast4: "4821",
      }),
    );
    renderWithProviders(<PayoutsCard wallet={wallet()} />);

    expect(await screen.findByText("Chase •••• 4821")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Withdraw" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Update bank" }),
    ).toBeInTheDocument();
  });

  it("disables withdrawing below the minimum balance", async () => {
    fetchPayoutAccountMock.mockResolvedValue(
      account({
        status: "verified",
        needsIdentity: false,
        needsBank: false,
        bankName: "Chase",
        bankLast4: "4821",
      }),
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
      account({
        status: "verified",
        needsIdentity: false,
        needsBank: false,
        bankName: "Chase",
        bankLast4: "4821",
      }),
    );
    renderWithProviders(<PayoutsCard wallet={undefined} />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Withdraw" })).toBeDisabled(),
    );
    expect(
      screen.getByRole("button", { name: "Withdraw" }),
    ).not.toHaveAttribute("title");
  });
});
