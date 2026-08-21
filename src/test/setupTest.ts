// Before anything imports apiClient (which fails fast on a missing base URL):
// component tests never hit the network, so any syntactically valid URL works.
process.env.NEXT_PUBLIC_API_URL ??= "http://api.test";

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

// Referenced by vitest.config.ts's setupFiles since the scaffold was created,
// but never written — the test tier could not start until this existed.

// Money is masked by default in the app. Tests assert on real amounts, so the
// revealed preference is stored before each render; a test that wants the masked
// default removes this key itself.
beforeEach(() => {
  try {
    window.localStorage.setItem("hh.money.hidden", "false");
  } catch {
    // Storage unavailable in this environment — masked default applies.
  }
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// jsdom implements neither, and Radix primitives (select, dialog) touch both.
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
}

// jsdom does not implement real navigation, so clicking a plain <a href>
// (an unmocked next/link with no router context to intercept it, say) logs
// "Not implemented: navigation" to stderr on every such click — noise, not a
// real failure, since no test here asserts on an actual page change. Silenced
// globally so it stays fixed for every test of this shape, not just the one
// that first hit it.
const originalConsoleError = console.error;
console.error = (...args: Parameters<typeof console.error>) => {
  if (
    typeof args[0] === "string" &&
    args[0].includes("Not implemented: navigation")
  ) {
    return;
  }
  originalConsoleError(...args);
};
