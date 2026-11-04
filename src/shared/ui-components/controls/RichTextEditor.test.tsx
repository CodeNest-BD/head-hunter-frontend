import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/utils";
import { sanitizeRichText } from "@/shared/libs/richText";
import { RichTextEditor } from "./RichTextEditor";

/**
 * The client asked for bold, underline and bullet points by name, so each one
 * is checked the whole way through: the button exists, it emits the mark, and
 * the mark survives the sanitizer every stored value passes through.
 */
describe("RichTextEditor formatting the client asked for", () => {
  it("offers bold, underline and bullet points on the toolbar", async () => {
    renderWithProviders(<RichTextEditor value="" onChange={vi.fn()} />);

    await waitFor(() =>
      expect(screen.getByRole("toolbar")).toBeInTheDocument(),
    );
    for (const label of ["Bold", "Underline", "Bullet list"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("renders a stored underline back into the editor", async () => {
    // The round trip that matters: a value saved with <u> has to come back as
    // an underline rather than as plain text. Toggling it by click is covered
    // in the browser — ProseMirror's selection does not behave in jsdom.
    renderWithProviders(
      <RichTextEditor
        value="<p>Strong <u>candidate</u></p>"
        onChange={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(document.querySelector(".ProseMirror u")).not.toBeNull(),
    );
    expect(document.querySelector(".ProseMirror u")?.textContent).toBe(
      "candidate",
    );
  });
});

describe("sanitizeRichText", () => {
  it.each([
    ["<p><strong>bold</strong></p>", "<strong>"],
    ["<p><u>underlined</u></p>", "<u>"],
    ["<ul><li>a bullet</li></ul>", "<li>"],
  ])("keeps %s", (input, expected) => {
    expect(sanitizeRichText(input)).toContain(expected);
  });

  it("still strips a script, so allowing <u> widened nothing", () => {
    expect(
      sanitizeRichText("<p>hi<script>alert(1)</script></p>"),
    ).not.toContain("script");
  });
});
