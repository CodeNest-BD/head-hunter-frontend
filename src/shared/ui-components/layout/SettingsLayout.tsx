"use client";

import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/shared/libs/shadCnConfig";

export interface SettingsSection {
  /** Anchor target for the rail link, and the section element's own id. */
  readonly id: string;
  readonly label: string;
  readonly content: ReactNode;
}

/**
 * Marks the section currently being read, so the rail reports where you are
 * rather than only where you last clicked.
 *
 * `ids` arrives as a fresh array every render, so the effect is keyed on the
 * joined contents instead — otherwise every parent render would tear down and
 * rebuild the observer.
 */
function useActiveSection(ids: readonly string[]): string {
  const key = ids.join("|");
  const [active, setActive] = useState(ids[0] ?? "");

  useEffect(() => {
    const order = key.split("|").filter(Boolean);
    const elements = order
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (elements.length === 0) return;

    const onScreen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) onScreen.add(entry.target.id);
          else onScreen.delete(entry.target.id);
        }
        // The topmost section still on screen is the one being read; a tall
        // section stays marked for as long as any of it is in the band.
        const reading = order.find((id) => onScreen.has(id));
        if (reading) setActive(reading);
      },
      // The band starts below the sticky top bar and ends short of the fold,
      // so a section only counts once it has cleared the chrome above it and
      // the last short section can still win on a long page.
      { rootMargin: "-96px 0px -55% 0px" },
    );
    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  }, [key]);

  return active;
}

/**
 * The redesign's settings shape: a section rail carrying the page's contents,
 * the sections themselves stacked beside it. It replaces tabs — every section
 * is on the page and reachable by scrolling, and the rail only says where you
 * are, so nothing is hidden behind a click.
 *
 * Below `lg` the rail lies down into a scrollable strip above the sections,
 * where a 200px column would cost most of the width.
 */
export function SettingsLayout({
  sections,
}: {
  sections: readonly SettingsSection[];
}) {
  const active = useActiveSection(sections.map((section) => section.id));

  return (
    <div className="flex flex-wrap items-start gap-5 lg:flex-nowrap lg:gap-8">
      <nav
        aria-label="Settings sections"
        className="flex w-full gap-1 overflow-x-auto lg:sticky lg:top-[calc(var(--topbar-h)+1.75rem)] lg:w-auto lg:flex-[0_1_200px] lg:flex-col"
      >
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={active === section.id ? "true" : undefined}
            className={cn(
              "flex h-9 shrink-0 items-center whitespace-nowrap rounded-sm px-3 text-sub transition-colors",
              active === section.id
                ? "bg-surface font-[650] text-ink shadow-e1"
                : "font-medium text-ink-muted hover:text-ink",
            )}
          >
            {section.label}
          </a>
        ))}
      </nav>

      <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-5">
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            aria-label={section.label}
            // Keeps an anchor jump from landing under the sticky top bar.
            className="flex scroll-mt-[calc(var(--topbar-h)+1.5rem)] flex-col gap-4"
          >
            {section.content}
          </section>
        ))}
      </div>
    </div>
  );
}
