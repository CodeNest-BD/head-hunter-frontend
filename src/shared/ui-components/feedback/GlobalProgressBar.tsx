"use client";

import { useEffect, useRef, useState } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";

/**
 * A slim top-of-viewport loading bar, driven by the number of in-flight React
 * Query fetches and mutations. Because virtually every page loads its data
 * through React Query, this gives a single, always-visible answer to "is
 * something loading?" without wiring a spinner into each screen.
 *
 * Behaviour mirrors the familiar YouTube/GitHub bar: it appears and trickles
 * toward ~90% while work is in flight, snaps to 100% when the last request
 * settles, then fades out. Purely presentational — it reads global state and
 * renders a fixed element above all app chrome.
 */
export function GlobalProgressBar() {
  const busy = useIsFetching() + useIsMutating() > 0;

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  // Refs so the driving effect depends only on `busy` — no stale-closure reads
  // of `visible`, and no re-running the trickle when progress ticks.
  const showingRef = useRef(false);
  const trickleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearTrickle = (): void => {
      if (trickleRef.current) {
        clearInterval(trickleRef.current);
        trickleRef.current = null;
      }
    };

    if (busy) {
      if (hideRef.current) {
        clearTimeout(hideRef.current);
        hideRef.current = null;
      }
      showingRef.current = true;
      setVisible(true);
      // Jump in so the bar is immediately perceptible, then ease toward 90%:
      // faster early, slower as it nears the cap so it never "finishes" on its
      // own while requests are still open.
      setProgress((p) => (p < 8 ? 8 : p));
      clearTrickle();
      trickleRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 90) return p;
          const step = p < 40 ? 7 : p < 70 ? 3 : 1;
          return Math.min(90, p + step);
        });
      }, 300);
    } else if (showingRef.current) {
      clearTrickle();
      setProgress(100);
      hideRef.current = setTimeout(() => {
        showingRef.current = false;
        setVisible(false);
        setProgress(0);
      }, 320);
    }

    return clearTrickle;
  }, [busy]);

  // Clear the fade-out timer if we unmount mid-animation.
  useEffect(
    () => () => {
      if (hideRef.current) clearTimeout(hideRef.current);
    },
    [],
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px]"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 200ms ease" }}
    >
      <div
        className="h-full bg-primary"
        style={{
          width: `${progress}%`,
          transition: "width 300ms ease",
          boxShadow: "0 0 8px hsl(var(--primary) / 0.7)",
        }}
      />
    </div>
  );
}
