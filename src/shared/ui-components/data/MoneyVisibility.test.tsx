import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import {
  Money,
  MoneyVisibilityProvider,
  MoneyVisibilityToggle,
} from "./MoneyVisibility";

const STORAGE_KEY = "hh.money.hidden";

function renderMoney() {
  return render(
    <MoneyVisibilityProvider>
      <Money minor={130_000} />
      <MoneyVisibilityToggle />
    </MoneyVisibilityProvider>,
  );
}

describe("money visibility", () => {
  beforeEach(() => {
    // The shared setup reveals money for every other test; these assertions are
    // about the real default, so the stored preference is cleared first.
    window.localStorage.removeItem(STORAGE_KEY);
  });

  it("masks an amount until the viewer asks to see it", () => {
    renderMoney();

    expect(screen.queryByText("$1,300")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Amount hidden")).toBeInTheDocument();
  });

  it("reveals the amount when toggled, and hides it again", async () => {
    renderMoney();

    await userEvent.click(screen.getByRole("button", { name: "Show amounts" }));
    expect(screen.getByText("$1,300")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Hide amounts" }));
    expect(screen.queryByText("$1,300")).not.toBeInTheDocument();
  });

  it("remembers a revealed preference for the next visit", async () => {
    renderMoney();

    await userEvent.click(screen.getByRole("button", { name: "Show amounts" }));

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("false");
  });

  it("honours a stored revealed preference on first render", async () => {
    window.localStorage.setItem(STORAGE_KEY, "false");

    renderMoney();

    expect(await screen.findByText("$1,300")).toBeInTheDocument();
  });

  it("shows an absent amount as a dash rather than masking nothing", () => {
    render(
      <MoneyVisibilityProvider>
        <Money minor={null} />
      </MoneyVisibilityProvider>,
    );

    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
