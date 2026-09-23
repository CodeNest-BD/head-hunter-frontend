import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/utils";
import { MIN_PAYOUT_MINOR } from "../schemas";
import { validateWithdrawAmount, WithdrawDialog } from "./WithdrawDialog";

const createPayoutMock = vi.fn();

vi.mock("../api/billing", () => ({
  createPayout: (...args: unknown[]) => createPayoutMock(...args),
}));

describe("validateWithdrawAmount", () => {
  it("rejects empty and non-numeric input", () => {
    expect(validateWithdrawAmount("", 100_000)).toEqual({
      error: "Enter an amount to withdraw.",
    });
    expect(validateWithdrawAmount("abc", 100_000)).toEqual({
      error: "Enter an amount to withdraw.",
    });
    expect(validateWithdrawAmount("0", 100_000)).toEqual({
      error: "Enter an amount to withdraw.",
    });
  });

  it("rejects sub-cent amounts instead of silently rounding them", () => {
    // Math.round would turn 49.995 into exactly the $50 floor — the user
    // typed less than the minimum and must not sneak past it.
    expect(validateWithdrawAmount("49.995", 100_000)).toEqual({
      error: "Enter dollars and cents, like 1250.50.",
    });
    expect(validateWithdrawAmount("100.123", 100_000)).toEqual({
      error: "Enter dollars and cents, like 1250.50.",
    });
  });

  it("enforces the minimum", () => {
    expect(validateWithdrawAmount("49.99", 100_000)).toEqual({
      error: "The minimum withdrawal is $50.",
    });
    expect(validateWithdrawAmount("50", 100_000)).toEqual({
      amountMinor: MIN_PAYOUT_MINOR,
    });
  });

  it("caps at the available balance", () => {
    expect(validateWithdrawAmount("1000.01", 100_000)).toEqual({
      error: "You can withdraw up to $1,000.",
    });
    expect(validateWithdrawAmount("1000", 100_000)).toEqual({
      amountMinor: 100_000,
    });
  });

  it("converts dollars and cents to minor units", () => {
    expect(validateWithdrawAmount("123.45", 100_000)).toEqual({
      amountMinor: 12_345,
    });
  });
});

describe("WithdrawDialog", () => {
  beforeEach(() => {
    createPayoutMock.mockReset();
  });

  function renderDialog(availableMinor = 320_000) {
    return renderWithProviders(
      <WithdrawDialog availableMinor={availableMinor}>
        <button type="button">Open withdraw</button>
      </WithdrawDialog>,
    );
  }

  function pendingPayout(amountMinor: number) {
    return {
      id: "po_1",
      amountMinor,
      status: "pending",
      failureReason: null,
      createdAt: "2026-09-23T10:00:00.000Z",
      paidAt: null,
    };
  }

  it("shows the available balance and validates before calling the API", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Open withdraw" }));
    expect(screen.getByText("$3,200")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Amount"), "10");
    await user.click(screen.getByRole("button", { name: "Withdraw" }));

    expect(
      screen.getByText("The minimum withdrawal is $50."),
    ).toBeInTheDocument();
    expect(createPayoutMock).not.toHaveBeenCalled();
  });

  it("submits the amount in minor units with an idempotency key", async () => {
    const user = userEvent.setup();
    createPayoutMock.mockResolvedValue(pendingPayout(150_000));
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Open withdraw" }));
    await user.type(screen.getByLabelText("Amount"), "1500");
    await user.click(screen.getByRole("button", { name: "Withdraw" }));

    await waitFor(() => expect(createPayoutMock).toHaveBeenCalledTimes(1));
    expect(createPayoutMock).toHaveBeenCalledWith(
      150_000,
      expect.stringMatching(/^[0-9a-f-]{36}$/),
    );

    // Success closes the dialog.
    await waitFor(() =>
      expect(screen.queryByLabelText("Amount")).not.toBeInTheDocument(),
    );
  });

  it("fills the full balance via Withdraw all", async () => {
    const user = userEvent.setup();
    createPayoutMock.mockResolvedValue(pendingPayout(320_000));
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Open withdraw" }));
    await user.click(screen.getByRole("button", { name: "Withdraw all" }));
    expect(screen.getByLabelText("Amount")).toHaveValue("3200");

    await user.click(screen.getByRole("button", { name: "Withdraw" }));
    await waitFor(() => expect(createPayoutMock).toHaveBeenCalledTimes(1));
    expect(createPayoutMock).toHaveBeenCalledWith(320_000, expect.any(String));
  });

  it("keeps the same idempotency key when retrying the same amount", async () => {
    const user = userEvent.setup();
    createPayoutMock.mockRejectedValue(new Error("network"));
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Open withdraw" }));
    await user.type(screen.getByLabelText("Amount"), "100");

    await user.click(screen.getByRole("button", { name: "Withdraw" }));
    await waitFor(() => expect(createPayoutMock).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole("button", { name: "Withdraw" }));
    await waitFor(() => expect(createPayoutMock).toHaveBeenCalledTimes(2));

    const [firstCall, secondCall] = createPayoutMock.mock.calls;
    expect(secondCall).toEqual(firstCall);
  });

  it("mints a new idempotency key when the amount changes", async () => {
    const user = userEvent.setup();
    createPayoutMock.mockRejectedValue(new Error("network"));
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Open withdraw" }));
    const amountField = screen.getByLabelText("Amount");

    await user.type(amountField, "100");
    await user.click(screen.getByRole("button", { name: "Withdraw" }));
    await waitFor(() => expect(createPayoutMock).toHaveBeenCalledTimes(1));

    // An edited amount is a NEW request — reusing the old key would make the
    // backend replay the original $100 payout for a $200 ask.
    await user.clear(amountField);
    await user.type(amountField, "200");
    await user.click(screen.getByRole("button", { name: "Withdraw" }));
    await waitFor(() => expect(createPayoutMock).toHaveBeenCalledTimes(2));

    const [firstCall, secondCall] = createPayoutMock.mock.calls;
    expect(firstCall).toEqual([10_000, expect.any(String)]);
    expect(secondCall).toEqual([20_000, expect.any(String)]);
    expect(secondCall?.[1]).not.toBe(firstCall?.[1]);
  });
});
