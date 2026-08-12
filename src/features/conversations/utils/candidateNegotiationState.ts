import type { Interview } from "@/features/interviews";
import type { Offer } from "@/features/offers";

/**
 * The interview side of a candidate's negotiation state. `superseded` has no
 * analogue here — the interview lifecycle only ever moves through these four
 * — and a `scheduled` interview always carries the confirmed slot it was
 * scheduled around, so a card never has to reach past this shape for the one
 * fact worth showing.
 */
export type InterviewBadge =
  | { kind: "awaiting_time" }
  | { kind: "scheduled"; confirmedSlotStart: string; confirmedSlotEnd: string }
  | { kind: "completed" }
  | { kind: "canceled" };

/**
 * The offer side. Deliberately has no `superseded` member — a superseded
 * offer is never the live one for its candidate, so the type itself makes
 * "render a superseded offer" unrepresentable rather than relying on every
 * caller to remember to check the status.
 */
export type OfferBadge =
  | { kind: "sent"; salaryMinor: number | null }
  | { kind: "accepted"; salaryMinor: number | null }
  | { kind: "declined"; salaryMinor: number | null }
  | { kind: "countered"; salaryMinor: number | null };

export interface CandidateNegotiationState {
  interview: InterviewBadge | null;
  offer: OfferBadge | null;
}

function groupByCandidateId<T extends { candidateId: string }>(
  items: T[],
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    const bucket = grouped.get(item.candidateId);
    if (bucket) {
      bucket.push(item);
    } else {
      grouped.set(item.candidateId, [item]);
    }
  }
  return grouped;
}

/** The most advanced round is the one worth showing — earlier rounds are
 * history, not current state. */
function pickLatestInterview(interviews: Interview[]): Interview {
  return interviews.reduce((latest, candidate) =>
    candidate.round > latest.round ? candidate : latest,
  );
}

/** The offer not yet superseded by a counter — the supersede chain has at
 * most one live head per candidate; if data ever disagrees, the most
 * recently created one wins rather than an arbitrary array position. */
function pickLiveOffer(offers: Offer[]): Offer | null {
  const live = offers.filter((offer) => offer.status !== "superseded");
  if (live.length === 0) return null;
  return live.reduce((latest, offer) =>
    Date.parse(offer.createdAt) > Date.parse(latest.createdAt) ? offer : latest,
  );
}

function toInterviewBadge(interview: Interview): InterviewBadge {
  switch (interview.status) {
    case "proposed":
      return { kind: "awaiting_time" };
    case "scheduled":
      return interview.confirmedSlotStart && interview.confirmedSlotEnd
        ? {
            kind: "scheduled",
            confirmedSlotStart: interview.confirmedSlotStart,
            confirmedSlotEnd: interview.confirmedSlotEnd,
          }
        // Defensive only: `scheduled` is reached by confirming a slot, which
        // always sets both fields — this falls back rather than lying about
        // a time that isn't there.
        : { kind: "awaiting_time" };
    case "completed":
      return { kind: "completed" };
    case "canceled":
      return { kind: "canceled" };
  }
}

/** `null` for `superseded` — see `OfferBadge`'s own note on why that status
 * has no member to map onto. */
function toOfferBadge(offer: Offer): OfferBadge | null {
  const salaryMinor = offer.placementDetails?.salaryMinor ?? null;
  switch (offer.status) {
    case "sent":
      return { kind: "sent", salaryMinor };
    case "accepted":
      return { kind: "accepted", salaryMinor };
    case "declined":
      return { kind: "declined", salaryMinor };
    case "countered":
      return { kind: "countered", salaryMinor };
    case "superseded":
      return null;
  }
}

/**
 * Pure, single-pass-per-list derivation from the two page-level queries
 * (`useInterviews({ submissionId })`, `useOffers({ submissionId })`) into a
 * map a candidate card can look up in O(1) — no query per candidate, no
 * `.find()` inside a card's render. A candidate absent from both lists is
 * simply absent from the returned map; callers treat a missing entry the
 * same as `{ interview: null, offer: null }`.
 */
export function candidateNegotiationState(
  interviews: Interview[],
  offers: Offer[],
): Map<string, CandidateNegotiationState> {
  const interviewsByCandidate = groupByCandidateId(interviews);
  const offersByCandidate = groupByCandidateId(offers);

  const candidateIds = new Set<string>([
    ...interviewsByCandidate.keys(),
    ...offersByCandidate.keys(),
  ]);

  const state = new Map<string, CandidateNegotiationState>();
  for (const candidateId of candidateIds) {
    const candidateInterviews = interviewsByCandidate.get(candidateId) ?? [];
    const candidateOffers = offersByCandidate.get(candidateId) ?? [];

    const interview =
      candidateInterviews.length > 0
        ? toInterviewBadge(pickLatestInterview(candidateInterviews))
        : null;

    const liveOffer = pickLiveOffer(candidateOffers);
    const offer = liveOffer ? toOfferBadge(liveOffer) : null;

    state.set(candidateId, { interview, offer });
  }

  return state;
}
