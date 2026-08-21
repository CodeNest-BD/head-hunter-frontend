import type {
  InterviewBadge,
  OfferBadge,
} from "@/features/conversations/utils/candidateNegotiationState";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatDateTime } from "@/shared/utils/formatDate";
import { useFormatMoney } from "./MoneyVisibility";

export interface NegotiationStateBadgesProps {
  interview: InterviewBadge | null;
  offer: OfferBadge | null;
}

/**
 * Same four-tone palette the two detail pages already use for their status
 * pills (submission/candidate `STATUS_STYLES`) — no new visual primitive,
 * just applied to a third, separate fact.
 */
const TONE_STYLES = {
  neutral: {
    dot: "bg-muted-foreground/50",
    pill: "bg-muted text-muted-foreground",
  },
  pending: { dot: "bg-[#92610C]", pill: "text-[#92610C] bg-[#FBF3DF]" },
  positive: { dot: "bg-[#17734E]", pill: "text-[#17734E] bg-[#E7F4EC]" },
  active: { dot: "bg-primary", pill: "bg-primary/15 text-primary" },
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
  // The amount is baked into the phrase, so masking has to happen here rather
  // than by wrapping a standalone element.
  formatMoney: (minor: number | null | undefined) => string,
): BadgeContent {
  if (!offer) return { phrase: "none yet", tone: "neutral" };
  const salary =
    offer.salaryMinor !== null ? ` · ${formatMoney(offer.salaryMinor)}` : "";
  switch (offer.kind) {
    case "sent":
      return { phrase: `offer sent${salary}`, tone: "pending" };
    case "accepted":
      return { phrase: `accepted${salary}`, tone: "positive" };
    case "declined":
      return { phrase: `declined${salary}`, tone: "neutral" };
    case "countered":
      return { phrase: `countered${salary}`, tone: "active" };
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
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        tone.pill,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tone.dot)}
        aria-hidden="true"
      />
      {label}: <span className="font-normal">{content.phrase}</span>
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
}: NegotiationStateBadgesProps) {
  const formatMoney = useFormatMoney();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <NegotiationBadge
        label="Interview"
        content={describeInterview(interview)}
      />
      <NegotiationBadge
        label="Offer"
        content={describeOffer(offer, formatMoney)}
      />
    </div>
  );
}
