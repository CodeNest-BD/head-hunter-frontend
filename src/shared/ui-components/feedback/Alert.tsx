import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";

export type AlertTone = "info" | "warn" | "bad" | "ok";

const TONE: Record<AlertTone, { classes: string; Icon: LucideIcon }> = {
  info: { classes: "border-info-line bg-info-bg text-info", Icon: Info },
  warn: {
    classes: "border-warn-line bg-warn-bg text-warn",
    Icon: AlertTriangle,
  },
  bad: { classes: "border-bad-line bg-bad-bg text-bad", Icon: XCircle },
  ok: { classes: "border-ok-line bg-ok-bg text-ok", Icon: CheckCircle2 },
};

export interface AlertProps {
  tone: AlertTone;
  children: ReactNode;
  /** Replaces the tone's default glyph. */
  icon?: LucideIcon;
  className?: string;
}

/**
 * The reference's `.alert`: a tinted 8px-radius band whose border, fill and ink
 * all come from one semantic tone, led by a 15px glyph. Everything inside —
 * including any link — inherits the tone's ink.
 */
export function Alert({ tone, children, icon, className }: AlertProps) {
  const { classes, Icon } = TONE[tone];
  const Glyph = icon ?? Icon;
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-2.5 rounded-sm border px-3.5 py-[11px] text-sub",
        classes,
        className,
      )}
    >
      <Glyph className="mt-[1.5px] size-[15px] shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 [&_a]:font-[650] [&_a]:underline [&_b]:font-[650] [&_strong]:font-[650]">
        {children}
      </div>
    </div>
  );
}
