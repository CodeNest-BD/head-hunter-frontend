"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";

export interface ExpandableBlockProps {
  children: ReactNode;
  /** How tall the block may grow before it is worth collapsing, in pixels. */
  collapsedHeight?: number;
  moreLabel?: string;
  lessLabel?: string;
  className?: string;
}

/**
 * Collapses a block that turned out to be long, and says so.
 *
 * The toggle appears only when the content genuinely overflows, measured
 * rather than guessed: the thing being collapsed here is usually rich text,
 * where a character count says nothing about rendered height — two hundred
 * characters of bullet list is far taller than two hundred of prose. Measuring
 * also means a short overview reads exactly as it did before, with no control
 * suggesting there is more to see when there is not.
 *
 * Re-measures on resize, because the same text wraps to a different height in
 * a 400px rail than in a dialog.
 */
export function ExpandableBlock({
  children,
  collapsedHeight = 260,
  moreLabel = "See more",
  lessLabel = "See less",
  className,
}: ExpandableBlockProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const measure = useCallback(() => {
    const node = contentRef.current;
    if (!node) return;
    // A pixel of slack: sub-pixel line heights make an exactly-fitting block
    // report one scroll pixel more than its client height, which would offer
    // "See more" on content that is already whole.
    setOverflows(node.scrollHeight > collapsedHeight + 1);
  }, [collapsedHeight]);

  useEffect(() => {
    measure();
    const node = contentRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
    // Deliberately not keyed on `children`: that is a new object on every
    // parent render, which would tear down and re-attach the observer each
    // time. The observer is watching the content node, so it already fires
    // when the children change the block's height.
  }, [measure]);

  const collapsed = overflows && !expanded;

  return (
    <div className={className}>
      <div className="relative">
        <div
          ref={contentRef}
          style={collapsed ? { maxHeight: collapsedHeight } : undefined}
          className={cn(collapsed && "overflow-hidden")}
        >
          {children}
        </div>
        {collapsed && (
          /* Fades the cut rather than slicing a line of text in half, so the
             clipped edge reads as "continues" instead of as a rendering
             fault. */
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-surface"
          />
        )}
      </div>
      {overflows && (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          className="mt-1.5 inline-flex items-center gap-1 text-meta font-[650] text-blue transition-colors hover:text-blue-ink"
        >
          {expanded ? lessLabel : moreLabel}
          {expanded ? (
            <ChevronUp aria-hidden="true" className="size-3.5" />
          ) : (
            <ChevronDown aria-hidden="true" className="size-3.5" />
          )}
        </button>
      )}
    </div>
  );
}
