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
