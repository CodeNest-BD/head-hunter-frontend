import type { ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/shared/libs/shadCnConfig";

export interface MobileRecordField {
  label: string;
  value: ReactNode;
}

export interface MobileRecordCardProps {
  /** The row's identifying value — company name, job title, candidate name. */
  title: ReactNode;
  /** Secondary identity line, e.g. "Acme Corp · Dallas, TX". */
  subtitle?: ReactNode;
  /** Pinned to the title's right; a status badge in practice. */
  trailing?: ReactNode;
  /** Label/value pairs, rendered as a two-column definition list. */
  fields: MobileRecordField[];
  /** Row actions, along the card's bottom edge. */
  actions?: ReactNode;
  /** When set, the title block links to the record's detail page. */
  href?: string;
  /** Row-level styling, e.g. the tint marking a record that needs attention. */
  className?: string;
}

/**
 * The `<ul>` that holds `MobileRecordCard`s. Rows are separated by the same
 * hairline the table body uses, so the mobile list reads as the same surface
 * as the table it replaces rather than as a stack of detached cards.
 */
export function MobileRecordList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ul className={cn("divide-y divide-border", className)}>{children}</ul>
  );
}

/**
 * One table row, restacked for a phone: identity on top, the remaining
 * columns as label/value pairs beneath. Fields carrying no value are dropped
 * rather than rendered as an empty row — a blank right-hand column reads as a
 * loading state on a narrow screen.
 */
export function MobileRecordCard({
  title,
  subtitle,
  trailing,
  fields,
  actions,
  href,
  className,
}: MobileRecordCardProps) {
  const identity = (
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-navy">{title}</p>
      {subtitle && (
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );

  const populated = fields.filter(
    (field) =>
      field.value !== null && field.value !== undefined && field.value !== "",
  );

  return (
    <li className={cn("px-4 py-3.5", className)}>
      <div className="flex items-start gap-3">
        {href ? (
          <Link href={href} className="min-w-0 flex-1">
            {identity}
          </Link>
        ) : (
          identity
        )}
        {trailing && <div className="shrink-0">{trailing}</div>}
      </div>

      {populated.length > 0 && (
        <dl className="mt-3 space-y-1.5">
          {populated.map((field) => (
            <div key={field.label} className="flex items-baseline gap-3">
              <dt className="w-28 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-[#616676]">
                {field.label}
              </dt>
              <dd className="min-w-0 flex-1 text-sm text-foreground">
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {actions && (
        <div className="mt-3 flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </li>
  );
}
