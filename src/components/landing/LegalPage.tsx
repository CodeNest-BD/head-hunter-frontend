import { PublicShell } from "./PublicShell";

/**
 * A block within a legal section: a plain string is a paragraph, `{ sub }` a
 * bold sub-heading, and `{ list }` a bulleted list. Keeps the per-page content
 * files terse to author while the layout owns all the styling.
 */
export type LegalBlock =
  | string
  | { readonly sub: string }
  | { readonly list: readonly string[] };

export interface LegalSection {
  /** Anchor id, e.g. "fees" — used by the table of contents and deep links. */
  readonly id: string;
  /** Displayed number, e.g. "7". */
  readonly number: string;
  readonly title: string;
  readonly blocks: readonly LegalBlock[];
}

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === "string") {
    return <p className="mt-4 first:mt-0">{block}</p>;
  }
  if ("sub" in block) {
    return (
      <p className="mt-5 font-semibold text-navy first:mt-0">{block.sub}</p>
    );
  }
  return (
    <ul className="mt-3 flex flex-col gap-1.5 first:mt-0">
      {block.list.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span
            aria-hidden="true"
            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50"
          />
          <span>{item}</span>
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
      {/* Header band */}
      <header className="border-b border-brand-line bg-gradient-to-b from-secondary to-background">
        <div className="mx-auto max-w-[1100px] px-5 py-14 md:px-10 md:py-16">
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-primary">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-[-0.02em] text-navy md:text-5xl">
            {title}
          </h1>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-brand-line bg-white px-3 py-1 text-xs font-medium text-brand-gray">
            Last updated {updated}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1100px] px-5 py-12 md:px-10 md:py-16">
        <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
          {/* Table of contents — sticky on desktop, scrolls if it runs long. */}
          <nav
            aria-label="On this page"
            className="mb-10 lg:mb-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:self-start lg:overflow-y-auto lg:pr-2"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-gray-light">
              On this page
            </p>
            <ol className="mt-3 flex flex-col gap-1">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex gap-2 rounded-md px-2 py-1.5 text-[13px] leading-snug text-brand-slate transition-colors hover:bg-accent hover:text-primary"
                  >
                    <span className="w-4 shrink-0 text-right font-semibold tabular-nums text-brand-gray-light">
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
            <div className="text-[15px] leading-relaxed text-brand-slate">
              {intro.map((paragraph) => (
                <p key={paragraph} className="mt-4 first:mt-0">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-10">
              {sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-24 border-t border-brand-line pt-8"
                >
                  <h2 className="flex items-baseline gap-3 font-heading text-xl font-bold text-navy">
                    <span className="text-base font-extrabold tabular-nums text-primary">
                      {section.number}
                    </span>
                    {section.title}
                  </h2>
                  <div className="mt-3 text-[15px] leading-relaxed text-brand-slate">
                    {section.blocks.map((block, index) => (
                      <Block key={index} block={block} />
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <p className="mt-12 rounded-lg border border-brand-line bg-secondary/50 px-5 py-4 text-sm text-brand-slate">
              Questions about this page? Contact us at{" "}
              <a
                href="mailto:info@head-hunters.com"
                className="font-semibold text-brand-secondary underline-offset-2 hover:underline"
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
