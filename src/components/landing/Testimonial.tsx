"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";

interface Quote {
  quote: string;
  name: string;
  title: string;
}

// Placeholder social proof — swap for real customer quotes when available.
const TESTIMONIALS: readonly Quote[] = [
  {
    quote: "Finally, recruiting on your terms.",
    name: "Michael T.",
    title: "COO",
  },
  {
    quote:
      "We filled two senior roles in a fortnight — and only paid on the hires that stuck.",
    name: "Priya N.",
    title: "Head of Talent",
  },
  {
    quote:
      "Setting our own fee changed everything. The right recruiters came straight to us.",
    name: "David R.",
    title: "Founder",
  },
  {
    quote:
      "Sourcing, messaging, and payouts in one place. No more spreadsheet chaos.",
    name: "Sara L.",
    title: "VP People",
  },
];

const AUTO_ADVANCE_MS = 6000;

/**
 * A rotating band of customer quotes: auto-advancing, pausable on hover/focus,
 * with prev/next controls and dot indicators. Content is placeholder for now.
 */
export function Testimonial() {
  const count = TESTIMONIALS.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (next: number) => setIndex((next + count) % count),
    [count],
  );

  useEffect(() => {
    if (paused || count <= 1) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % count),
      AUTO_ADVANCE_MS,
    );
    return () => clearInterval(id);
  }, [paused, count]);

  const active = TESTIMONIALS[index];

  return (
    <section className="border-t border-brand-line bg-background">
      <div
        className="mx-auto max-w-[1240px] px-5 py-12 md:px-10"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <div
          className="mx-auto flex max-w-3xl items-center gap-3 sm:gap-6"
          aria-roledescription="carousel"
          aria-label="Customer testimonials"
        >
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous testimonial"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-line text-brand-gray transition-colors hover:border-primary/40 hover:text-primary"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <figure
            key={index}
            className="min-w-0 flex-1 text-center [animation:fadeUp_400ms_ease_both]"
            aria-live="polite"
          >
            <blockquote className="text-balance font-heading text-xl font-extrabold text-navy sm:text-2xl">
              &ldquo;{active.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-3 text-sm font-medium text-brand-gray">
              — {active.name}, {active.title}
            </figcaption>
          </figure>

          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next testimonial"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-line text-brand-gray transition-colors hover:border-primary/40 hover:text-primary"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          {TESTIMONIALS.map((item, i) => (
            <button
              key={item.name}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              aria-current={i === index}
              className={cn(
                "h-2 rounded-full transition-all",
                i === index
                  ? "w-6 bg-primary"
                  : "w-2 bg-brand-line hover:bg-brand-gray/50",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
