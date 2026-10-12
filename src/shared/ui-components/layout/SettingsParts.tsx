import type { ReactNode } from "react";

import { cn } from "@/shared/libs/shadCnConfig";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";

/**
 * One settings section: the design's card head — a title over the one line
 * that says what the section governs, with room for a badge at the right edge
 * — above whatever the section is made of.
 *
 * The head never wraps its aside onto a second line: the badge there is a
 * short status ("Read-only"), and dropping it below the title reads as a
 * second heading.
 */
export function SettingsCard({
  title,
  description,
  aside,
  children,
  className,
}: {
  title: string;
  description?: string;
  /** A badge or small readout pinned to the right of the title. */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex-nowrap items-start">
        <div className="min-w-0 flex-1">
          <CardTitle>{title}</CardTitle>
          {description && (
            <CardDescription className="mt-0.5">{description}</CardDescription>
          )}
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </CardHeader>
      {children}
    </Card>
  );
}

/**
 * A ruled strip at the foot of a settings card: one fact on the left and the
 * control that changes it on the right — the design's password row.
 */
export function SettingsActionRow({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-line-row px-6 py-3.5",
        className,
      )}
    >
      <span className="text-sub text-ink-body">{children}</span>
      {action}
    </div>
  );
}
