import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { StateSelect } from "./StateSelect";

describe("StateSelect", () => {
  it("shows the selected state's name on the trigger", () => {
    render(<StateSelect value="DE" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Delaware");
  });

  it("filters the list as you type and returns the chosen code", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StateSelect value="" onChange={onChange} />);

    await user.click(screen.getByRole("combobox"));
    await user.type(
      screen.getByRole("textbox", { name: /search states/i }),
      "flor",
    );

    const list = screen.getByRole("listbox");
    // Only the matching state remains after filtering.
    expect(within(list).getByText("Florida")).toBeInTheDocument();
    expect(within(list).queryByText("Alabama")).not.toBeInTheDocument();

    await user.click(within(list).getByText("Florida"));
    expect(onChange).toHaveBeenCalledWith("FL");
  });

  it("offers a clear option only when clearLabel is set", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <StateSelect value="FL" onChange={onChange} clearLabel="All states" />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(
      within(screen.getByRole("listbox")).getByText("All states"),
    );
    // The clear option maps back to the picker's "none" value.
    expect(onChange).toHaveBeenCalledWith("");
  });
});
