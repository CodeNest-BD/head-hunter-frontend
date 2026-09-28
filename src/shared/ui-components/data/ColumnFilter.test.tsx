import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ColumnFilter } from "./ColumnFilter";

const OPTIONS = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "expired", label: "Expired" },
];

describe("ColumnFilter", () => {
  it("reports the chosen value and closes", async () => {
    const onChange = vi.fn();
    render(
      <ColumnFilter
        label="Status"
        options={OPTIONS}
        value={null}
        onChange={onChange}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /Filter by Status/ }),
    );
    await userEvent.click(screen.getByText("Draft"));

    expect(onChange).toHaveBeenCalledWith("draft");
  });

  it("tells assistive tech when the column is filtered", () => {
    render(
      <ColumnFilter
        label="Status"
        options={OPTIONS}
        value="draft"
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Filter by Status (filtered)" }),
    ).toBeInTheDocument();
  });

  it("clears back to no filter", async () => {
    const onChange = vi.fn();
    render(
      <ColumnFilter
        label="Status"
        options={OPTIONS}
        value="draft"
        onChange={onChange}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /Filter by Status/ }),
    );
    await userEvent.click(screen.getByText("Clear"));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("adds to the selection rather than replacing it when multiple", async () => {
    const onChange = vi.fn();
    render(
      <ColumnFilter
        multiple
        label="Status"
        options={OPTIONS}
        value={new Set(["draft"])}
        onChange={onChange}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /Filter by Status/ }),
    );
    await userEvent.click(screen.getByText("Published"));

    expect(onChange).toHaveBeenCalledWith(new Set(["draft", "published"]));
  });

  it("removes an already-selected value when multiple", async () => {
    const onChange = vi.fn();
    render(
      <ColumnFilter
        multiple
        label="Status"
        options={OPTIONS}
        value={new Set(["draft", "published"])}
        onChange={onChange}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /Filter by Status/ }),
    );
    await userEvent.click(screen.getByText("Draft"));

    expect(onChange).toHaveBeenCalledWith(new Set(["published"]));
  });

  it("counts the selection on the clear row when multiple", async () => {
    render(
      <ColumnFilter
        multiple
        label="Status"
        options={OPTIONS}
        value={new Set(["draft", "published"])}
        onChange={vi.fn()}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /Filter by Status/ }),
    );

    expect(screen.getByText("Clear (2)")).toBeInTheDocument();
  });

  it("searches once the list is long enough to need it", async () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      value: `v${i}`,
      label: `Option ${i}`,
    }));
    render(
      <ColumnFilter
        label="Job"
        options={many}
        value={null}
        onChange={vi.fn()}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /Filter by Job/ }),
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "Search Job" }),
      "11",
    );

    expect(screen.getByText("Option 11")).toBeInTheDocument();
    expect(screen.queryByText("Option 2")).not.toBeInTheDocument();
  });
});
