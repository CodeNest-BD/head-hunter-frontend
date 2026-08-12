import type { ReactNode } from "react";

import { cn } from "@/shared/libs/shadCnConfig";
import type { ConversationCandidateRef } from "../schemas";

export interface CandidateFilterChipsProps {
  candidates: ConversationCandidateRef[];
  selectedCandidateId: string | null;
  onSelect: (candidateId: string | null) => void;
}

function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {children}
    </button>
  );
}

/**
 * "All" plus one chip per candidate on the submission. Selecting a candidate
 * asks the server to filter to that candidate's entries; untagged system
 * events (e.g. "Candidates submitted") stay visible regardless, since they
 * describe the submission as a whole rather than one candidate.
 */
export function CandidateFilterChips({
  candidates,
  selectedCandidateId,
  onSelect,
}: CandidateFilterChipsProps) {
  if (candidates.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <ChipButton
        active={selectedCandidateId === null}
        onClick={() => onSelect(null)}
      >
        All
      </ChipButton>
      {candidates.map((candidate) => (
        <ChipButton
          key={candidate.id}
          active={selectedCandidateId === candidate.id}
          onClick={() => onSelect(candidate.id)}
        >
          {candidate.fullName}
        </ChipButton>
      ))}
    </div>
  );
}
