import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Referenced by vitest.config.ts's setupFiles since the scaffold was created,
// but never written — the test tier could not start until this existed.

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
