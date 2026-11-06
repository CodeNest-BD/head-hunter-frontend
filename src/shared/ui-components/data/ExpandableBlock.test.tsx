import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ExpandableBlock } from "./ExpandableBlock";

/**
 * jsdom lays nothing out, so every element reports `scrollHeight: 0`. These
 * tests drive the one measurement the component makes by stubbing it, which
 * is also the only thing worth asserting: whether the toggle appears at all.
 */
function stubScrollHeight(value: number) {
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
    configurable: true,
    value,
  });
}

afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, "scrollHeight");
});

describe("ExpandableBlock", () => {
  it("leaves short content alone, with nothing to press", () => {
    stubScrollHeight(100);
    render(
      <ExpandableBlock collapsedHeight={200}>
        <p>A short overview.</p>
      </ExpandableBlock>,
    );

    expect(screen.getByText("A short overview.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("offers to expand content that overflows, and back again", () => {
    stubScrollHeight(900);
    render(
      <ExpandableBlock collapsedHeight={200}>
        <p>A very long overview.</p>
      </ExpandableBlock>,
    );

    const toggle = screen.getByRole("button", { name: /see more/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: /see less/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: /see less/i }));
    expect(
      screen.getByRole("button", { name: /see more/i }),
    ).toBeInTheDocument();
  });

  it("does not offer to expand content that fits exactly", () => {
    // Sub-pixel line heights make an exactly-fitting block report one scroll
    // pixel more than it uses; that must not count as overflow.
    stubScrollHeight(201);
    render(
      <ExpandableBlock collapsedHeight={200}>
        <p>Exactly one screenful.</p>
      </ExpandableBlock>,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("uses the labels it was given", () => {
    stubScrollHeight(900);
    render(
      <ExpandableBlock
        collapsedHeight={200}
        moreLabel="Read full overview"
        lessLabel="Show less"
      >
        <p>A very long overview.</p>
      </ExpandableBlock>,
    );

    expect(
      screen.getByRole("button", { name: /read full overview/i }),
    ).toBeInTheDocument();
  });
});
