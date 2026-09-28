"use client";

import type { ReactNode } from "react";
import { FileText, Target, User, type LucideIcon } from "lucide-react";

import type { PillTone } from "@/shared/ui-components/badges/Pill";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { Tile, type TileTone } from "@/shared/ui-components/list/Tile";
import { Avatar } from "@/shared/ui-components/badges/Avatar";
import { formatDate } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { CandidateAttachments } from "./CandidateAttachments";
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
  /** The candidate's pipeline stage — its label and semantic tone, supplied by
   * the caller so this panel never re-derives the status styling. */
  stageLabel: string;
  stageTone: PillTone;
  /** Header controls (Edit / Remove, or the company's schedule / offer entry
   * points) — rendered top-right beside the avatar. */
  headerActions?: ReactNode;
  /** A full-width strip below the header, e.g. a remove-confirmation. */
  banner?: ReactNode;
  /** Live interview/offer state, shown right under the stage it explains. */
  negotiation?: ReactNode;
  /** Extra sections appended after the standard ones (company actions). */
  children?: ReactNode;
}

/**
 * The candidate rail: a header (avatar, name, stage, actions), an at-a-glance
 * stat strip, then the candidate's details grouped into Contact / Profile /
 * Expectations cards and their attachments — the read-only mirror of the edit
 * form's sections, so viewing and editing read as the same object.
 */
export function CandidateDetailPanel({
  candidate,
  stageLabel,
  stageTone,
  headerActions,
  banner,
  negotiation,
  children,
}: CandidateDetailPanelProps) {
  const hasProfile =
    Boolean(candidate.overview) ||
    Boolean(candidate.currentCompany) ||
    candidate.yearsOfExperience !== null;
  const hasExpectations =
    candidate.expectedSalaryMinor !== null ||
    candidate.noticePeriodDays !== null;

  return (
    <div className="space-y-3.5 rounded-md border border-line bg-surface p-4 shadow-e1 lg:h-full lg:overflow-y-auto">
      {/* Header: who this is, their stage, and the record actions. */}
      <div className="flex items-start gap-3">
        <Avatar name={candidate.fullName} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-block font-[650] text-ink">
            {candidate.fullName}
          </p>
          <a
            href={`mailto:${candidate.email}`}
            className="truncate text-meta text-blue-ink underline-offset-2 hover:underline"
          >
            {candidate.email}
          </a>
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

      {negotiation}

      <Section
        icon={User}
        iconTone="blue"
        title="Contact"
        note="Visible to you only"
      >
        <Field label="Email">
          <a
            href={`mailto:${candidate.email}`}
            className="text-blue-ink underline-offset-2 hover:underline"
          >
            {candidate.email}
          </a>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone">{candidate.phone ?? "—"}</Field>
          <Field label="LinkedIn">
            {candidate.linkedinUrl ? (
              <a
                href={candidate.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-ink underline-offset-2 hover:underline"
              >
                Profile
              </a>
            ) : (
              "—"
            )}
          </Field>
        </div>
      </Section>

      {hasProfile ? (
        <Section icon={FileText} iconTone="warn" title="Profile">
          {candidate.overview ? (
            <div className="flex min-w-0 flex-col">
              <span className="text-label font-[650] uppercase text-ink-muted">
                Overview
              </span>
              <p className="mt-[3px] whitespace-pre-wrap text-sub leading-relaxed text-ink-body">
                {candidate.overview}
              </p>
            </div>
          ) : null}
          {(candidate.currentCompany ||
            candidate.yearsOfExperience !== null) && (
            <div className="grid grid-cols-2 gap-3">
              {candidate.currentCompany ? (
                <Field label="Current company">
                  {candidate.currentCompany}
                </Field>
              ) : null}
              {candidate.yearsOfExperience !== null ? (
                <Field label="Experience">
                  {candidate.yearsOfExperience} yrs
                </Field>
              ) : null}
            </div>
          )}
        </Section>
      ) : null}

      {hasExpectations ? (
        <Section icon={Target} iconTone="ok" title="Expectations">
          <div className="grid grid-cols-2 gap-3">
            {candidate.expectedSalaryMinor !== null ? (
              <Field label="Expected salary">
                {formatMinor(candidate.expectedSalaryMinor)} / yr
              </Field>
            ) : null}
            {candidate.noticePeriodDays !== null ? (
              <Field label="Notice period">
                {candidate.noticePeriodDays} days
              </Field>
            ) : null}
          </div>
        </Section>
      ) : null}

      <CandidateAttachments candidateId={candidate.id} />

      {children}
    </div>
  );
}
