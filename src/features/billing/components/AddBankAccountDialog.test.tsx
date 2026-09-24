import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/utils";
import type { PayoutAccount } from "../schemas";
import { AddBankAccountDialog } from "./AddBankAccountDialog";

const submitPayoutIdentityMock = vi.fn();
const submitPayoutBankMock = vi.fn();

vi.mock("../api/billing", () => ({
  submitPayoutIdentity: (...args: unknown[]) =>
    submitPayoutIdentityMock(...args),
  submitPayoutBank: (...args: unknown[]) => submitPayoutBankMock(...args),
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

function accountView(overrides: Partial<PayoutAccount> = {}): PayoutAccount {
  return account({
    status: "pending_verification",
    needsIdentity: false,
    needsBank: false,
    bankName: "Chase",
    bankLast4: "6789",
    ...overrides,
  });
}

async function fillIdentity(user: ReturnType<typeof userEvent.setup>) {
  // Names/email/phone are prefilled from the session; fill the rest.
  await user.type(screen.getByLabelText("Birth month"), "1");
  await user.type(screen.getByLabelText("Birth day"), "15");
  await user.type(screen.getByLabelText("Birth year"), "1990");
  await user.type(screen.getByLabelText("Last 4 digits of SSN"), "0000");
  await user.type(screen.getByLabelText("Home address"), "12 Main St");
  await user.type(screen.getByLabelText("City"), "Columbus");
  // StateSelect renders a trigger button (named by its placeholder) that
  // opens a searchable listbox.
  await user.click(screen.getByRole("button", { name: "State" }));
  await user.click(await screen.findByText("Ohio"));
  await user.type(screen.getByLabelText("ZIP code"), "43004");
  await user.click(screen.getByRole("checkbox"));
}

describe("AddBankAccountDialog", () => {
  beforeEach(() => {
    submitPayoutIdentityMock.mockReset();
    submitPayoutBankMock.mockReset();
    // jsdom has no scrollIntoView; SearchableSelect calls it when the state
    // list opens.
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  function renderDialog(payoutAccount = account()) {
    return renderWithProviders(
      <AddBankAccountDialog account={payoutAccount}>
        <button type="button">Open setup</button>
      </AddBankAccountDialog>,
    );
  }

  it("walks identity → bank and submits both payloads", async () => {
    const user = userEvent.setup();
    submitPayoutIdentityMock.mockResolvedValue(
      account({ status: "onboarding", needsIdentity: false, needsBank: true }),
    );
    submitPayoutBankMock.mockResolvedValue(accountView());
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Open setup" }));
    await fillIdentity(user);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() =>
      expect(submitPayoutIdentityMock).toHaveBeenCalledTimes(1),
    );
    expect(submitPayoutIdentityMock).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "Dana",
        dobDay: 15,
        dobMonth: 1,
        dobYear: 1990,
        ssnLast4: "0000",
        state: "OH",
        tosAccepted: true,
      }),
    );

    // Step 2 — bank details. Holder name prefilled from the legal name.
    const holder = await screen.findByLabelText("Account holder name");
    expect(holder).toHaveValue("Dana Whitfield");
    await user.type(screen.getByLabelText("Routing number"), "110000000");
    await user.type(screen.getByLabelText("Account number"), "000123456789");
    await user.type(
      screen.getByLabelText("Confirm account number"),
      "000123456789",
    );
    await user.click(screen.getByRole("button", { name: "Add bank account" }));

    await waitFor(() => expect(submitPayoutBankMock).toHaveBeenCalledTimes(1));
    expect(submitPayoutBankMock).toHaveBeenCalledWith({
      accountHolderName: "Dana Whitfield",
      routingNumber: "110000000",
      accountNumber: "000123456789",
    });
    // Success closes the dialog.
    await waitFor(() =>
      expect(screen.queryByLabelText("Routing number")).not.toBeInTheDocument(),
    );
  });

  it("rejects a routing number with a bad checksum before calling the API", async () => {
    const user = userEvent.setup();
    renderDialog(
      account({ status: "verified", needsIdentity: false, needsBank: true }),
    );

    await user.click(screen.getByRole("button", { name: "Open setup" }));
    await user.type(screen.getByLabelText("Routing number"), "110000001");
    await user.type(screen.getByLabelText("Account number"), "000123456789");
    await user.type(
      screen.getByLabelText("Confirm account number"),
      "000123456789",
    );
    await user.click(screen.getByRole("button", { name: "Add bank account" }));

    expect(
      await screen.findByText(
        "That routing number isn't valid — check it and try again",
      ),
    ).toBeInTheDocument();
    expect(submitPayoutBankMock).not.toHaveBeenCalled();
  });

  it("rejects mismatched account numbers", async () => {
    const user = userEvent.setup();
    renderDialog(
      account({ status: "verified", needsIdentity: false, needsBank: true }),
    );

    await user.click(screen.getByRole("button", { name: "Open setup" }));
    await user.type(screen.getByLabelText("Routing number"), "110000000");
    await user.type(screen.getByLabelText("Account number"), "000123456789");
    await user.type(
      screen.getByLabelText("Confirm account number"),
      "000123456780",
    );
    await user.click(screen.getByRole("button", { name: "Add bank account" }));

    expect(
      await screen.findByText("Account numbers don't match"),
    ).toBeInTheDocument();
    expect(submitPayoutBankMock).not.toHaveBeenCalled();
  });

  it("skips straight to the bank step when updating an existing account", async () => {
    const user = userEvent.setup();
    renderDialog(accountView({ status: "verified" }));

    await user.click(screen.getByRole("button", { name: "Open setup" }));

    expect(screen.getByText("Update Bank Account")).toBeInTheDocument();
    expect(screen.getByLabelText("Routing number")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Last 4 digits of SSN"),
    ).not.toBeInTheDocument();
  });

  it("keeps the identity step editable while verification is pending", async () => {
    const user = userEvent.setup();
    // needsIdentity is false during pending_verification, but the dialog is
    // the only place a typoed SSN/DOB can be corrected before Stripe fails it.
    renderDialog(accountView());

    await user.click(screen.getByRole("button", { name: "Open setup" }));

    expect(screen.getByText("Set Up Payouts")).toBeInTheDocument();
    expect(screen.getByLabelText("Last 4 digits of SSN")).toBeInTheDocument();
  });
});
