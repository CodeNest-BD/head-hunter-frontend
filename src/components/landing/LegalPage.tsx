import type { ReactNode } from "react";

import { PublicShell } from "./PublicShell";

export interface LegalSection {
  readonly heading: string;
  readonly body: ReactNode;
}

/**
 * Shared layout for the static legal pages (Terms, Privacy): the public chrome,
 * a centered readable column, an eyebrow + title + "last updated", an intro, and
 * numbered-feel sections. Content is passed in per page.
 */
export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: ReactNode;
  sections: readonly LegalSection[];
}) {
  return (
    <PublicShell>
      <article className="mx-auto max-w-3xl px-5 py-14 md:px-10">
        <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-primary">
          Legal
        </p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-[-0.02em] text-navy md:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-brand-gray">Last updated {updated}</p>

        <div className="mt-8 text-[15px] leading-relaxed text-brand-slate">
          {intro}
        </div>

        <div className="mt-8 flex flex-col gap-8">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-heading text-lg font-bold text-navy">
                {section.heading}
              </h2>
              <div className="mt-2 text-[15px] leading-relaxed text-brand-slate">
                {section.body}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-10 border-t border-brand-line pt-6 text-sm text-brand-gray">
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
    </PublicShell>
  );
}
