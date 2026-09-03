import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { NumericInput } from "./NumericInput";

describe("NumericInput", () => {
  it("strips letters and punctuation, keeping only digits", async () => {
    const user = userEvent.setup();
    render(<NumericInput aria-label="count" />);
    const field = screen.getByLabelText<HTMLInputElement>("count");

    await user.type(field, "1a2b3-c");
    expect(field.value).toBe("123");
  });

  it("allows a single decimal point in decimal mode", async () => {
    const user = userEvent.setup();
    render(<NumericInput decimal aria-label="amount" />);
    const field = screen.getByLabelText<HTMLInputElement>("amount");

    await user.type(field, "12.3x4.5");
    // Letters dropped and only the first dot kept.
    expect(field.value).toBe("12.345");
  });

  it("rejects a dot in integer mode", async () => {
    const user = userEvent.setup();
    render(<NumericInput aria-label="year" />);
    const field = screen.getByLabelText<HTMLInputElement>("year");

    await user.type(field, "20.24");
    expect(field.value).toBe("2024");
  });
});
