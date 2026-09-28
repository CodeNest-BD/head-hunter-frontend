import { formatDateTime } from "@/shared/utils/formatDate";
import type { InterviewSlot } from "../schemas";

export interface ProposedSlotListProps {
  slots: InterviewSlot[];
}

/**
 * Candidate windows nobody is being asked to pick from here: the company
 * looking at its own open batch, or either party looking at a superseded or
 * decided one. The dashed, muted rows read as "these are on the table" rather
 * than an active choice — `SlotRadioGroup` in `ProposalCard` is the half that
 * asks for a decision.
 *
 * Shared so the thread's proposal card and the candidate rail render one
 * batch identically; they used to be the same markup in two places.
 */
export function ProposedSlotList({ slots }: ProposedSlotListProps) {
  if (slots.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1.5">
      {slots.map((slot) => (
        <li
          key={slot.id}
          className="rounded-sm border border-dashed border-line-strong bg-surface-sub px-3 py-2 text-sub tabular-nums text-ink-muted"
        >
          {formatDateTime(slot.startAt)} – {formatDateTime(slot.endAt)}
        </li>
      ))}
    </ul>
  );
}
