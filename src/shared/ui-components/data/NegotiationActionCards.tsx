"use client";

import { OfferCard, ProposalCard } from "@/features/conversations";
import type { CandidateNegotiationState } from "@/features/conversations/utils/candidateNegotiationState";
import { toOfferEventData } from "@/features/conversations/utils/toOfferEventData";
import {
  proposalCardTitle,
  toProposalEventData,
} from "@/features/conversations/utils/toProposalEventData";

export interface NegotiationActionCardsProps {
  /** This candidate's entry from `candidateNegotiationState`, or `null` when
   * the candidate has neither an interview nor an offer yet. */
  negotiationState: CandidateNegotiationState | null;
  viewerParty: "company" | "recruiter";
}

/**
 * The actionable interview/offer cards mounted on a candidate card: the same
 * `ProposalCard`/`OfferCard` the thread renders, driven by this candidate's
 * `interviewRecord`/`offerRecord` instead of a thread event, so either party
 * can act on a negotiation without leaving the candidate list. Shared
 * between the company (`CandidateCard`) and recruiter (`CandidateItem`)
 * mount sites the same way `NegotiationStateBadges` already shares their
 * read-only status pills — one place to derive and render this, not two
 * near-identical copies.
 */
export function NegotiationActionCards({
  negotiationState,
  viewerParty,
}: NegotiationActionCardsProps) {
  const proposalData = negotiationState?.interviewRecord
    ? toProposalEventData(negotiationState.interviewRecord)
    : null;
  const offerData = negotiationState?.offerRecord
    ? toOfferEventData(negotiationState.offerRecord)
    : null;

  if (!proposalData && !offerData) {
    return null;
  }

  return (
    <>
      {proposalData && (
        <ProposalCard
          title={proposalCardTitle(proposalData.proposalStatus)}
          // The interview list carries no stored message body the way the
          // thread's events do — a live proposal here is always freshly
          // "proposed" (the backend only calls a batch live while it's
          // still awaiting a decision), so there is never a
          // counter-request note to show.
          note={null}
          data={proposalData}
          viewerParty={viewerParty}
        />
      )}
      {offerData && <OfferCard data={offerData} viewerParty={viewerParty} />}
    </>
  );
}
