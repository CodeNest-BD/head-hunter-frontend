import type { ReactNode } from "react";

/**
 * The `.band--tint` header the content pages (Legal, FAQ, Support) open with:
 * the white surface fading into the canvas behind a title and optional eyebrow.
 */
export function PublicPageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  /** Rendered under the title, e.g. the legal pages' "Last updated" chip. */
  children?: ReactNode;
}) {
  return (
    <header className="bg-gradient-to-b from-surface to-canvas py-9">
      <div className="mx-auto max-w-[1200px] px-6">
        {eyebrow && (
          <p className="mb-2 text-[11.5px] font-[750] uppercase tracking-[0.14em] text-blue">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[30px] font-extrabold leading-[1.18] tracking-[-0.022em] text-navy">
          {title}
        </h1>
        {children}
      </div>
    </header>
  );
}
