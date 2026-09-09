import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

function renderSelect(onValueChange: (value: string) => void) {
  render(
    // Inside a form, which is where Radix adds the hidden native select — and
    // so the only place this can happen.
    <form>
      <Select value="51-200" onValueChange={onValueChange}>
        <SelectTrigger aria-label="Employee size">
          <SelectValue placeholder="Select a range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="11-50">11-50</SelectItem>
          <SelectItem value="51-200">51-200</SelectItem>
        </SelectContent>
      </Select>
    </form>,
  );
  // Radix's hidden mirror of the value, which is what submits with the form.
  const native = document.querySelector("select");
  if (native === null) throw new Error("no native select rendered");
  return native;
}

describe("Select", () => {
  it("ignores the empty value the hidden native select reports", () => {
    // It coerces a value whose option it does not have yet, which would clear a
    // field the form had just prefilled.
    const onValueChange = vi.fn();
    const native = renderSelect(onValueChange);

    fireEvent.change(native, { target: { value: "" } });

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("still reports a real choice", () => {
    const onValueChange = vi.fn();
    const native = renderSelect(onValueChange);

    fireEvent.change(native, { target: { value: "11-50" } });

    expect(onValueChange).toHaveBeenCalledWith("11-50");
  });
});
