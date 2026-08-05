import type { ReactNode } from "react";
import { cn } from "@/shared/libs/shadCnConfig";
import { Eyebrow } from "./Eyebrow";
import { GradientRule } from "./GradientRule";

interface PageHeaderProps {
  /** Optional uppercase eyebrow label (rendered in the brand pill). */
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-aligned actions (e.g. a primary button). */
  actions?: ReactNode;
  /** Extra content under the header (e.g. filters), inside the rise animation. */
  children?: ReactNode;
  className?: string;
}

/**
 * Standard page header carrying the mock's identity: the eyebrow pill, a heavy
 * tightly-tracked headline, a muted subtitle, and the blue gradient rule — with
 * the mock's subtle entrance rise. Used on every authenticated page so the app
 * reads as one product with the landing.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-8 [animation:hh-rise_.6s_cubic-bezier(.22,1,.36,1)_both]",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <div className="mb-4">
              <Eyebrow>{eyebrow}</Eyebrow>
            </div>
          )}
          <h1 className="font-heading text-2xl font-extrabold tracking-[-0.02em] text-foreground sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-3">{actions}</div>
        )}
      </div>
      <GradientRule className="mt-5 max-w-[min(100%,320px)] opacity-80" />
      {children}
    </header>
  );
}
