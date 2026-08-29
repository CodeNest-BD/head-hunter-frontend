"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Whether an element's content is actually being cut off by a clamp or
 * `truncate`, so a tooltip can be offered only where there is something hidden
 * to reveal — hovering a title that already reads in full should do nothing.
 *
 * Re-measures on resize: the same title clamps at three columns and fits at
 * one, and nothing else would tell us the answer changed.
 */
export function useIsTruncated<T extends HTMLElement>(): {
  ref: React.RefObject<T>;
  isTruncated: boolean;
} {
  const ref = useRef<T>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // The extra pixel absorbs sub-pixel line-height rounding, which otherwise
    // reports a perfectly fitting single line as overflowing.
    const measure = (): void =>
      setIsTruncated(
        element.scrollHeight > element.clientHeight + 1 ||
          element.scrollWidth > element.clientWidth + 1,
      );

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, isTruncated };
}
