import { Card } from "@/shared/ui-components/controls/card";
import { PublicPageHeader } from "./PublicPageHeader";
import { PublicShell } from "./PublicShell";

export interface FaqEntry {
  readonly question: string;
  readonly answer: string;
}

/**
 * Every answer is shown open: the list is short enough to read top to bottom,
 * and a visitor scanning for one question finds it without clicking through.
 */
export function FaqPage({ entries }: { entries: readonly FaqEntry[] }) {
  return (
    <PublicShell>
      <PublicPageHeader title="Frequently Asked Questions" />

      <div className="mx-auto max-w-[1200px] px-6 pb-14">
        <Card className="max-w-[820px] divide-y divide-line">
          {entries.map((entry) => (
            <section key={entry.question} className="px-6 py-5">
              <h2 className="text-card font-[650] text-ink">
                {entry.question}
              </h2>
              <p className="mt-2 text-block leading-[1.7] text-ink-body">
                {entry.answer}
              </p>
            </section>
          ))}
        </Card>
      </div>
    </PublicShell>
  );
}
