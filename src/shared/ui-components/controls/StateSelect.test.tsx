import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StateSelect } from "./StateSelect";

describe("StateSelect inside a form", () => {
  it("ignores the empty echo from Radix's hidden native select", () => {
    const onChange = vi.fn();
    render(
      <form>
        <StateSelect value="DE" onChange={onChange} />
      </form>,
    );

    const hidden = document.querySelector("select");
    expect(hidden).not.toBeNull();
    if (hidden === null) return;
    expect(hidden.value).toBe("DE");

    // What Radix does when the option list has not registered yet.
    hidden.value = "";
    hidden.dispatchEvent(new Event("change", { bubbles: true }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
