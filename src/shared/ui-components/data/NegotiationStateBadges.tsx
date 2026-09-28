import type {
  InterviewBadge,
  OfferBadge,
} from "@/features/conversations/utils/candidateNegotiationState";
import type { OfferParty } from "@/features/offers";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatDateTime } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";

export interface NegotiationStateBadgesProps {
  interview: InterviewBadge | null;
  offer: OfferBadge | null;
  /** Who is reading — a pending offer reads differently to whoever sent it. */
  viewerParty: OfferParty;
}

/**
 * The same four semantic tones the status pills use, applied to a third,
 * separate fact — no new visual primitive, and no palette of its own.
 */
const TONE_STYLES = {
  neutral: { dot: "bg-neutral", pill: "bg-neutral-bg text-neutral" },
  pending: { dot: "bg-warn", pill: "bg-warn-bg text-warn" },
  positive: { dot: "bg-ok", pill: "bg-ok-bg text-ok" },
  active: { dot: "bg-info", pill: "bg-info-bg text-info" },
} as const;
type Tone = keyof typeof TONE_STYLES;

interface BadgeContent {
  phrase: string;
  tone: Tone;
}

function describeInterview(interview: InterviewBadge | null): BadgeContent {
  if (!interview) return { phrase: "none yet", tone: "neutral" };
  switch (interview.kind) {
    case "awaiting_time":
      return { phrase: "awaiting a time", tone: "pending" };
    case "scheduled":
      return {
        phrase: `scheduled ${formatDateTime(interview.confirmedSlotStart)}`,
        tone: "positive",
      };
    case "completed":
      return { phrase: "completed", tone: "active" };
    case "canceled":
      return { phrase: "canceled", tone: "neutral" };
  }
}

function describeOffer(
  offer: OfferBadge | null,
  viewerParty: OfferParty,
): BadgeContent {
  if (!offer) return { phrase: "none yet", tone: "neutral" };
  const salary =
    offer.salaryMinor !== null ? ` · ${formatMinor(offer.salaryMinor)}` : "";
  switch (offer.kind) {
    // "Offer sent" alone didn't say whose number it was or who owes the next
    // move — after a counter the answer flips, so it is phrased per viewer.
    case "sent":
      return offer.sentBy === viewerParty
        ? { phrase: `you sent${salary} · awaiting reply`, tone: "pending" }
        : { phrase: `awaiting your reply${salary}`, tone: "active" };
    case "accepted":
      return { phrase: `accepted${salary}`, tone: "positive" };
    case "declined":
      return { phrase: `declined${salary}`, tone: "neutral" };
    case "countered":
      return { phrase: `countered${salary}`, tone: "active" };
    case "withdrawn":
      return { phrase: `withdrawn${salary}`, tone: "neutral" };
  }
}

interface NegotiationBadgeProps {
  label: string;
  content: BadgeContent;
}

function NegotiationBadge({ label, content }: NegotiationBadgeProps) {
  const tone = TONE_STYLES[content.tone];
  return (
    <span
      className={cn(
        "inline-flex h-5.25 items-center gap-[5px] whitespace-nowrap rounded-full px-2 text-[11px] font-[650] tracking-[0.02em]",
        tone.pill,
      )}
    >
      <span
        className={cn("size-[5px] shrink-0 rounded-full", tone.dot)}
        aria-hidden="true"
      />
      {label}: <span className="font-[450]">{content.phrase}</span>
    </span>
  );
}

/**
 * The interview and offer rows on a candidate card — kept as two separate
 * pills, never merged into one line, so they stay visually distinct from
 * each other and from the company-controlled status control the card
 * renders alongside this. Read-only on both the company and recruiter side;
 * this component has no mutations of its own.
 */
export function NegotiationStateBadges({
  interview,
  offer,
  viewerParty,
}: NegotiationStateBadgesProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <NegotiationBadge
        label="Interview"
        content={describeInterview(interview)}
      />
      <NegotiationBadge
        label="Offer"
        content={describeOffer(offer, viewerParty)}
      />
    </div>
  );
}
