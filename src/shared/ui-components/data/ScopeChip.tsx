import Link from "next/link";
import { X } from "lucide-react";

/**
 * The reference's `.chip is-active`: a list that has been scoped by a
 * deep-link says so, and carries its own way back out.
 *
 * Without it a filtered board is indistinguishable from an empty one — the
 * reader sees four rows where the directory said forty and has nothing on
 * screen to explain the gap.
 */
export function ScopeChip({
  label,
  clearHref,
  clearLabel,
}: {
  /** e.g. "Company: Halcyon Freight". */
  label: string;
  /** The same page with the scope dropped. */
  clearHref: string;
  clearLabel: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-blue bg-blue px-[11px] text-[12.5px] font-[550] text-white">
        {label}
        <Link
          href={clearHref}
          aria-label={clearLabel}
          className="rounded-full p-0.5 transition-colors hover:bg-white/20"
        >
          <X className="size-3" />
        </Link>
      </span>
    </div>
  );
}
