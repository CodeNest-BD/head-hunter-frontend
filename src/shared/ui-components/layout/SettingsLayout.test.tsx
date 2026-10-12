import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";

import { SettingsLayout } from "./SettingsLayout";

/**
 * The two fields the layout's observer actually reads. Narrowing the callback
 * to this instead of the full `IntersectionObserverEntry` lets the stub hand
 * over a real object rather than casting one into shape.
 */
interface ObservedEntry {
  target: Element;
  isIntersecting: boolean;
}

type ObserverCallback = (entries: ObservedEntry[]) => void;

/**
 * jsdom has no IntersectionObserver, so the scroll-spy gets a stub that hands
 * the test the callback — the only way to say "this section is on screen"
 * without a real viewport.
 */
function installObserver(): { fire: (ids: readonly string[]) => void } {
  const callbacks: ObserverCallback[] = [];
  const observed = new Set<Element>();

  class StubObserver {
    constructor(callback: ObserverCallback) {
      callbacks.push(callback);
    }
    observe(element: Element) {
      observed.add(element);
    }
    disconnect() {
      observed.clear();
    }
    unobserve() {}
    takeRecords() {
      return [];
    }
  }

  vi.stubGlobal("IntersectionObserver", StubObserver);

  return {
    fire(ids) {
      const onScreen = new Set(ids);
      const entries = [...observed].map((target) => ({
        target,
        isIntersecting: onScreen.has(target.id),
      }));
      act(() => {
        for (const callback of callbacks) {
          callback(entries);
        }
      });
    },
  };
}

const SECTIONS = [
  { id: "account", label: "Account", content: <p>Account body</p> },
  { id: "rules", label: "Platform Rules", content: <p>Rules body</p> },
];

describe("SettingsLayout", () => {
  let observer: ReturnType<typeof installObserver>;

  beforeEach(() => {
    observer = installObserver();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("gives every section a rail link pointing at its anchor", () => {
    render(<SettingsLayout sections={SECTIONS} />);

    const rail = screen.getByRole("navigation", { name: "Settings sections" });
    expect(
      [...rail.querySelectorAll("a")].map((link) => [
        link.textContent,
        link.getAttribute("href"),
      ]),
    ).toEqual([
      ["Account", "#account"],
      ["Platform Rules", "#rules"],
    ]);
  });

  it("shows every section at once rather than one at a time", () => {
    render(<SettingsLayout sections={SECTIONS} />);

    expect(screen.getByText("Account body")).toBeInTheDocument();
    expect(screen.getByText("Rules body")).toBeInTheDocument();
  });

  it("marks the section being read, not the one last clicked", () => {
    render(<SettingsLayout sections={SECTIONS} />);

    expect(screen.getByRole("link", { name: "Account" })).toHaveAttribute(
      "aria-current",
      "true",
    );

    observer.fire(["rules"]);

    expect(
      screen.getByRole("link", { name: "Platform Rules" }),
    ).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Account" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("keeps the topmost section marked while several are on screen", () => {
    render(<SettingsLayout sections={SECTIONS} />);

    observer.fire(["account", "rules"]);

    expect(screen.getByRole("link", { name: "Account" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });
});
