import type { ReactNode } from "react";

import { PublicShell } from "./PublicShell";

/**
 * A block within a legal section: a plain string is a paragraph, `{ sub }` a
 * bold sub-heading, `{ strong }` a paragraph the source document emphasises
 * (the liability and warranty disclaimers), and `{ list }` a bulleted list.
 * Keeps the per-page content files terse to author while the layout owns all
 * the styling.
 */
export type LegalBlock =
  | string
  | { readonly sub: string }
  | { readonly strong: string }
  | { readonly list: readonly string[] };

export interface LegalSection {
  /** Anchor id, e.g. "fees" — used by the table of contents and deep links. */
  readonly id: string;
  /** Displayed number, e.g. "7". */
  readonly number: string;
  readonly title: string;
  readonly blocks: readonly LegalBlock[];
}

/**
 * Renders the `**…**` spans the content files use for the phrases the source
 * document bolds mid-sentence (`the laws of the **State of Florida**`). The
 * content is plain `.ts` data, so it cannot carry JSX of its own, and a whole
 * markdown dependency would be a lot of library for one delimiter.
 */
function emphasise(text: string): ReactNode {
  const parts = text.split("**");
  if (parts.length === 1) return text;
  return parts.map((part, index) =>
    // Odd indexes are what sat between a pair of delimiters.
    index % 2 === 1 ? (
      <strong key={index} className="font-[650] text-ink">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === "string") {
    // `whitespace-pre-line`: a paragraph may carry a hard line break where the
    // source sets an address block on consecutive lines.
    return (
      <p className="mt-2.5 whitespace-pre-line first:mt-0">
        {emphasise(block)}
      </p>
    );
  }
  if ("sub" in block) {
    return <p className="mt-4 font-[650] text-ink first:mt-0">{block.sub}</p>;
  }
  if ("strong" in block) {
    return (
      <p className="mt-2.5 font-[650] text-ink first:mt-0">{block.strong}</p>
    );
  }
  return (
    <ul className="mt-2.5 flex flex-col gap-1.5 first:mt-0">
      {block.list.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span
            aria-hidden="true"
            className="mt-2 size-1.5 shrink-0 rounded-full bg-sky"
          />
          <span>{emphasise(item)}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Layout for the long-form legal pages (Terms, Privacy): a header band, a sticky
 * table of contents on the left that deep-links to each section, and a readable
 * numbered body on the right. Sections carry `scroll-mt` so an anchor jump
 * clears the sticky site nav. Content is passed in per page as plain data.
 */
export function LegalPage({
  eyebrow = "Legal",
  title,
  updated,
  intro,
  sections,
}: {
  eyebrow?: string;
  title: string;
  updated: string;
  /** Lead paragraphs shown above the first numbered section. */
  intro: readonly string[];
  sections: readonly LegalSection[];
}) {
  return (
    <PublicShell>
      {/* `.band--tint` — the header fades the white surface into the canvas. */}
      <header className="bg-gradient-to-b from-surface to-canvas py-9">
        <div className="mx-auto max-w-[1200px] px-6">
          <p className="text-[11.5px] font-[750] uppercase tracking-[0.14em] text-blue">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-[30px] font-extrabold leading-[1.18] tracking-[-0.022em] text-navy">
            {title}
          </h1>
          <span className="mt-3 inline-flex h-5.25 items-center rounded-full bg-neutral-bg px-2 text-[11px] font-[650] tracking-[0.02em] text-neutral">
            Last updated {updated}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-6 pb-6 pt-9">
        <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
          {/* Table of contents — sticky on desktop, scrolls if it runs long. */}
          <nav
            aria-label="On this page"
            className="mb-8 lg:sticky lg:top-[84px] lg:mb-0 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:pr-2"
          >
            <p className="px-2.5 pb-2 text-label font-[650] uppercase text-ink-muted">
              On this page
            </p>
            <ol className="flex flex-col">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex gap-2 rounded-xs px-2.5 py-[5px] text-[12.5px] leading-snug text-ink-muted transition-colors hover:bg-tint hover:text-blue-ink"
                  >
                    <span className="w-4 shrink-0 text-right tabular-nums text-ink-faint">
                      {section.number}
                    </span>
                    <span>{section.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* Body */}
          <article className="min-w-0">
            <div className="max-w-prose text-block leading-[1.7] text-ink-body">
              {intro.map((paragraph) => (
                <p key={paragraph} className="mt-2.5 first:mt-0">
                  {emphasise(paragraph)}
                </p>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-7">
              {sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-20 border-t border-line pt-6"
                >
                  <h2 className="flex items-baseline gap-2 text-[16px] font-bold text-ink">
                    <span className="tabular-nums text-blue">
                      {section.number}.
                    </span>
                    {section.title}
                  </h2>
                  <div className="mt-2.5 max-w-prose text-block leading-[1.7] text-ink-body">
                    {section.blocks.map((block, index) => (
                      <Block key={index} block={block} />
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <p className="mt-6 rounded-sm border border-line bg-surface-sub px-3 py-2.5 text-sub text-ink-muted">
              Questions about this page? Contact us at{" "}
              <a
                href="mailto:info@head-hunters.com"
                className="font-semibold text-blue-ink underline-offset-2 hover:underline"
              >
                info@head-hunters.com
              </a>
              .
            </p>
          </article>
        </div>
      </div>
    </PublicShell>
  );
}
