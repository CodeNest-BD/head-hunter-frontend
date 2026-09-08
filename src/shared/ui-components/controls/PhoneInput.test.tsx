import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PhoneInput } from "./PhoneInput";

function ControlledPhoneInput() {
  const [value, setValue] = useState("");
  return <PhoneInput value={value} onChange={setValue} />;
}

describe("PhoneInput", () => {
  it("backspaces through the brackets the formatter adds", async () => {
    const user = userEvent.setup();
    render(<ControlledPhoneInput />);
    const field = screen.getByPlaceholderText<HTMLInputElement>("Phone number");

    await user.type(field, "618");
    expect(field.value).toBe("(618)");

    // Deleting the ")" removes no digit, so without the fix the field
    // reformats straight back to "(618)" and looks stuck.
    await user.type(field, "{backspace}{backspace}{backspace}{backspace}");
    expect(field.value).toBe("");
  });
});
