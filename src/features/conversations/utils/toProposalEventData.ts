import type { Interview } from "@/features/interviews";
import type { ProposalEventData } from "../components/ProposalCard";

/**
 * Mirrors the backend's `PROPOSAL_TITLES` (conversation-timeline.service.ts).
 * The thread gets its title computed server-side so wording can never drift;
 * `GET /v1/interviews` carries no such title, so this is the one place the
 * wording is computed client-side instead — keep this map in sync with the
 * backend's by hand.
 */
const PROPOSAL_CARD_TITLES: Record<
  ProposalEventData["proposalStatus"],
  string
> = {
  proposed: "Availability proposed",
  counter_requested: "New times requested",
  confirmed: "Interview time confirmed",
  expired: "Availability expired",
  unknown: "Availability update",
};

export function proposalCardTitle(
  proposalStatus: ProposalEventData["proposalStatus"],
): string {
  return PROPOSAL_CARD_TITLES[proposalStatus];
}

/**
 * REST `Interview` → the shape `ProposalCard` renders, or `null` when there
 * is no open proposal — the card has nothing to render then. `slots` come
 * straight from `liveProposal.slots` (`ConversationSlotDto[]`, the thread's
 * own slot type), so they map 1:1 with no shape translation.
 */
export function toProposalEventData(
  interview: Interview,
): ProposalEventData | null {
  const { liveProposal } = interview;
  if (!liveProposal) return null;

  return {
    kind: "proposal",
    interviewId: interview.id,
    availabilityProposalId: liveProposal.id,
    proposalStatus: liveProposal.status,
    interviewStatus: interview.status,
    confirmedSlotStart: interview.confirmedSlotStart,
    confirmedSlotEnd: interview.confirmedSlotEnd,
    slots: liveProposal.slots,
  };
}
