import { cn } from "@/shared/libs/shadCnConfig";

/**
 * How a fact reads: a short value is the record's own strong ink, a written
 * claim or resolution note is body copy. Two named readings rather than a
 * `muted` boolean, so a third can never mean "both".
 */
type FactVariant = "value" | "prose";

const VALUE_CLASS: Record<FactVariant, string> = {
  value: "text-body font-[550] text-ink",
  prose: "text-body font-[450] text-ink-body",
};

/**
 * One cell of a dispute's fact grid — the reference's `.fact`: an 11px
 * uppercase label over its value. Shared by the participant and admin detail
 * views so a dispute reads the same from either side of the case.
 */
export function DisputeFact({
  label,
  value,
  variant = "value",
  className,
}: {
  label: string;
  value: string;
  variant?: FactVariant;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-label font-[650] uppercase text-ink-muted">{label}</p>
      <p
        className={cn(
          "mt-[3px] whitespace-pre-wrap break-words",
          VALUE_CLASS[variant],
        )}
      >
        {value}
      </p>
    </div>
  );
}
