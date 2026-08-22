"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * A slim top-of-viewport progress bar tied to *route changes only* — not to
 * in-page data fetches. Refetching a list, applying a filter, or clicking a
 * state on the map never flashes it; only navigating to another page does.
 *
 * It starts when a navigation is initiated (an internal link click, a
 * history push/replace from router.push/replace, or back/forward) and
 * completes when the new route commits (pathname/search change). Behaviour
 * mirrors the familiar YouTube/GitHub bar: trickle toward ~90% while the
 * navigation is in flight, snap to 100% on arrival, then fade.
 */
export function GlobalProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const showingRef = useRef(false);
  const trickleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // If a "navigation" never changes the route (e.g. a same-URL link), finish
  // on its own so the bar can never get stuck on screen.
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTrickle = useCallback(() => {
    if (trickleRef.current) {
      clearInterval(trickleRef.current);
      trickleRef.current = null;
    }
  }, []);

  const done = useCallback(() => {
    if (!showingRef.current) return;
    clearTrickle();
    if (safetyRef.current) {
      clearTimeout(safetyRef.current);
      safetyRef.current = null;
    }
    setProgress(100);
    hideRef.current = setTimeout(() => {
      showingRef.current = false;
      setVisible(false);
      setProgress(0);
    }, 320);
  }, [clearTrickle]);

  const start = useCallback(() => {
    if (showingRef.current) return; // A navigation is already in flight.
    if (hideRef.current) {
      clearTimeout(hideRef.current);
      hideRef.current = null;
    }
    showingRef.current = true;
    setVisible(true);
    // Jump in so the bar is immediately perceptible, then ease toward 90%.
    setProgress((p) => (p < 8 ? 8 : p));
    clearTrickle();
    trickleRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p;
        const step = p < 40 ? 7 : p < 70 ? 3 : 1;
        return Math.min(90, p + step);
      });
    }, 300);
    if (safetyRef.current) clearTimeout(safetyRef.current);
    safetyRef.current = setTimeout(done, 3000);
  }, [clearTrickle, done]);

  // Detect navigation *start*. Next's client router commits history changes
  // only once the RSC payload arrives, so intercepting the link click (and
  // back/forward) is what gives the bar a visible head start.
  useEffect(() => {
    const differsFromCurrent = (url?: string | URL | null): boolean => {
      if (url === null || url === undefined) return false;
      const next = new URL(String(url), window.location.href);
      return (
        next.origin === window.location.origin &&
        (next.pathname !== window.location.pathname ||
          next.search !== window.location.search)
      );
    };

    const onClick = (event: MouseEvent): void => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }
      if (differsFromCurrent(anchor.getAttribute("href"))) start();
    };

    const origPush = window.history.pushState;
    const origReplace = window.history.replaceState;
    // Only trip on a genuine URL change; router internals call replaceState for
    // same-URL housekeeping (scroll restoration) that must not flash the bar.
    window.history.pushState = function (data, unused, url) {
      if (differsFromCurrent(url)) start();
      return origPush.call(window.history, data, unused, url);
    };
    window.history.replaceState = function (data, unused, url) {
      if (differsFromCurrent(url)) start();
      return origReplace.call(window.history, data, unused, url);
    };
    const onPopState = (): void => start();

    document.addEventListener("click", onClick, { capture: true });
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("popstate", onPopState);
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
    };
  }, [start]);

  // Complete once the new route has actually committed. Skip the first run so a
  // fresh page load never flashes the bar.
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    done();
  }, [pathname, searchParams, done]);

  useEffect(
    () => () => {
      if (hideRef.current) clearTimeout(hideRef.current);
      if (safetyRef.current) clearTimeout(safetyRef.current);
      if (trickleRef.current) clearInterval(trickleRef.current);
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
