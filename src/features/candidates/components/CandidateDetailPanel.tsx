"use client";

import type { ReactNode } from "react";
import { CalendarClock, FileText, User, type LucideIcon } from "lucide-react";

import type { OfferParty } from "@/features/offers";
import type { PillTone } from "@/shared/ui-components/badges/Pill";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { Tile, type TileTone } from "@/shared/ui-components/list/Tile";
import { Avatar } from "@/shared/ui-components/badges/Avatar";
import { formatDate } from "@/shared/utils/formatDate";
import { CandidateAttachments } from "./CandidateAttachments";
import { CandidateFields } from "./CandidateFields";
import type { Candidate } from "../schemas";

/** One label-over-value pair inside a section card — the `.fact` recipe. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="text-label font-[650] uppercase text-ink-muted">
        {label}
      </span>
      <span className="mt-[3px] break-words text-body font-[550] text-ink">
        {children}
      </span>
    </div>
  );
}

/** A titled sub-card: an icon-tile header over a body of fields. */
function Section({
  icon,
  iconTone,
  title,
  note,
  children,
}: {
  icon: LucideIcon;
  iconTone: TileTone;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface shadow-e1">
      {/* `.card__head` */}
      <div className="flex items-center gap-2.5 border-b border-line bg-surface-sub px-3.5 py-2.5">
        <Tile icon={icon} tone={iconTone} className="size-6 rounded-xs" />
        <span className="text-sub font-[650] text-ink">{title}</span>
        {note ? (
          <span className="ml-auto text-[11px] text-ink-faint">{note}</span>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 p-3.5">{children}</div>
    </div>
  );
}

interface CandidateDetailPanelProps {
  candidate: Candidate;
  /** Contact details are the submitting recruiter's alone; a company reaches
   * the candidate through the recruiter, so its panel never shows them. */
  viewerParty: OfferParty;
  /** The candidate's pipeline stage — its label and semantic tone, supplied by
   * the caller so this panel never re-derives the status styling. */
  stageLabel: string;
  stageTone: PillTone;
  /** Header controls (the recruiter's Edit / Remove) — rendered top-right
   * beside the avatar. */
  headerActions?: ReactNode;
  /** A full-width strip below the header, e.g. a remove-confirmation. */
  banner?: ReactNode;
  /** Live interview/offer state, shown right under the stage it explains. */
  negotiation?: ReactNode;
  /** The company's interview, offer and pass controls, under the state they
   * act on. */
  actions?: ReactNode;
}

/**
 * The candidate panel: a header (avatar, name, actions), an at-a-glance stat
 * strip, the interview and offer section, then the candidate's details
 * grouped into Contact (recruiter only) and Candidate Information cards and
 * their attachments.
 */
export function CandidateDetailPanel({
  candidate,
  viewerParty,
  stageLabel,
  stageTone,
  headerActions,
  banner,
  negotiation,
  actions,
}: CandidateDetailPanelProps) {
  const showsContact = viewerParty === "recruiter";

  return (
    <div className="space-y-3.5 rounded-md border border-line bg-surface p-4 shadow-e1 lg:h-full lg:overflow-y-auto">
      {/* Header: who this is, their stage, and the record actions. */}
      <div className="flex items-start gap-3">
        <Avatar name={candidate.fullName} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-block font-[650] text-ink">
            {candidate.fullName}
          </p>
          {showsContact && (
            <a
              href={`mailto:${candidate.email}`}
              className="truncate text-meta text-blue-ink underline-offset-2 hover:underline"
            >
              {candidate.email}
            </a>
          )}
        </div>
        {headerActions ? (
          <div className="flex shrink-0 items-center gap-1">
            {headerActions}
          </div>
        ) : null}
      </div>

      {banner}

      {/* At-a-glance stats — the reference's `.well` under a three-up grid. */}
      <div className="grid grid-cols-3 gap-2 rounded-sm border border-line bg-surface-sub px-3 py-2.5">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-label font-[650] uppercase text-ink-muted">
            Stage
          </span>
          <StatusBadge
            label={stageLabel}
            tone={stageTone}
            className="w-fit max-w-full"
          />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="text-label font-[650] uppercase text-ink-muted">
            Submitted
          </span>
          <span className="mt-[3px] text-sub font-[650] tabular-nums text-ink">
            {formatDate(candidate.createdAt)}
          </span>
        </div>
        {candidate.yearsOfExperience !== null ? (
          <div className="flex min-w-0 flex-col">
            <span className="text-label font-[650] uppercase text-ink-muted">
              Experience
            </span>
            <span className="mt-[3px] text-sub font-[650] tabular-nums text-ink">
              {candidate.yearsOfExperience} yrs
            </span>
          </div>
        ) : null}
      </div>

      {(negotiation || actions) && (
        <Section icon={CalendarClock} iconTone="ok" title="Interview & Offer">
          {negotiation}
          {actions}
        </Section>
      )}

      {showsContact && (
        <Section
          icon={User}
          iconTone="blue"
          title="Contact"
          note="Visible to you only"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <a
                href={`mailto:${candidate.email}`}
                className="text-blue-ink underline-offset-2 hover:underline"
              >
                {candidate.email}
              </a>
            </Field>
            <Field label="Phone">{candidate.phone ?? "—"}</Field>
          </div>
        </Section>
      )}

      <Section icon={FileText} iconTone="warn" title="Candidate Information">
        <CandidateFields candidate={candidate} />
      </Section>

      <CandidateAttachments candidateId={candidate.id} />
    </div>
  );
}
