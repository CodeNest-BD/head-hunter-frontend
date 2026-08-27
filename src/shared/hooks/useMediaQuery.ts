"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Whether a CSS media query currently matches.
 *
 * For the cases CSS alone cannot settle — where the *markup* has to differ per
 * breakpoint, not just its styling. Prefer a Tailwind `sm:`/`lg:` class
 * wherever hiding one of two rendered branches would do; reach for this only
 * when rendering both would duplicate real content in the DOM.
 *
 * There is no viewport on the server, so the server snapshot is `false` and the
 * real value lands on hydration. Write the query so `false` means the wider
 * layout, which is what the server markup should describe.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onStoreChange);
      return () => list.removeEventListener("change", onStoreChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
