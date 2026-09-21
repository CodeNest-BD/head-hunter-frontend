"use client";

import type { ReactNode } from "react";
import { FileText, Target, User } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { formatDate } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { CandidateAttachments } from "./CandidateAttachments";
import type { Candidate } from "../schemas";

/** A stable per-name tint for the avatar tile, shared with the inbox rows. */
const AVATAR_PALETTE = [
  "bg-[#E8EDFB] text-[#3F5BA9]",
  "bg-[#FBF1DC] text-[#8A6D3B]",
  "bg-[#E7F0E9] text-[#3F7A5A]",
  "bg-[#F2E9F3] text-[#7A4F86]",
  "bg-[#FBE9E6] text-[#9B4A3F]",
];
function avatarTint(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** One label-over-value pair inside a section card. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[10.5px] font-semibold text-muted-foreground">
        {label}
      </span>
      <span className="truncate text-[13px] text-foreground">{children}</span>
    </div>
  );
}

/** A titled sub-card: an icon-tile header over a body of fields. */
function Section({
  icon,
  iconTint,
  title,
  note,
  children,
}: {
  icon: ReactNode;
  iconTint: string;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border/70 bg-secondary/40 px-3.5 py-2.5">
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
            iconTint,
          )}
        >
          {icon}
        </span>
        <span className="text-[13px] font-semibold text-navy">{title}</span>
        {note ? (
          <span className="ml-auto text-[11px] text-muted-foreground">
            {note}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 p-3.5">{children}</div>
    </div>
  );
}

interface CandidateDetailPanelProps {
  candidate: Candidate;
  /** The candidate's pipeline stage — its label and chip colour, supplied by
   * the caller so this panel never re-derives the status styling. */
  stageLabel: string;
  stageClassName: string;
  /** Header controls (Edit / Remove, or the company's schedule / offer entry
   * points) — rendered top-right beside the avatar. */
  headerActions?: ReactNode;
  /** A full-width strip below the header, e.g. a remove-confirmation. */
  banner?: ReactNode;
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
  stageClassName,
  headerActions,
  banner,
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
    <div className="flex flex-col gap-3.5 rounded-md border border-border/70 bg-card p-4 shadow-sm lg:h-full lg:overflow-y-auto">
      {/* Header: who this is, their stage, and the record actions. */}
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold",
            avatarTint(candidate.fullName),
          )}
        >
          {initials(candidate.fullName)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate font-heading text-base font-semibold text-navy">
            {candidate.fullName}
          </p>
          <a
            href={`mailto:${candidate.email}`}
            className="truncate text-xs text-primary underline-offset-2 hover:underline"
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

      {/* At-a-glance stats. */}
      <div className="grid grid-cols-3 gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-muted-foreground">
            Stage
          </span>
          <span
            className={cn(
              "w-fit rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide",
              stageClassName,
            )}
          >
            {stageLabel}
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-muted-foreground">
            Submitted
          </span>
          <span className="text-[13px] font-semibold text-navy">
            {formatDate(candidate.createdAt)}
          </span>
        </div>
        {candidate.yearsOfExperience !== null ? (
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[10px] font-semibold text-muted-foreground">
              Experience
            </span>
            <span className="text-[13px] font-semibold text-navy">
              {candidate.yearsOfExperience} yrs
            </span>
          </div>
        ) : null}
      </div>

      <Section
        icon={<User className="h-3.5 w-3.5" />}
        iconTint="bg-primary/10 text-primary"
        title="Contact"
        note="Visible to you only"
      >
        <Field label="Email">
          <a
            href={`mailto:${candidate.email}`}
            className="text-primary underline-offset-2 hover:underline"
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
                className="text-primary underline-offset-2 hover:underline"
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
        <Section
          icon={<FileText className="h-3.5 w-3.5" />}
          iconTint="bg-[#FBF1DC] text-[#8A6D3B]"
          title="Profile"
        >
          {candidate.overview ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10.5px] font-semibold text-muted-foreground">
                Overview
              </span>
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
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
        <Section
          icon={<Target className="h-3.5 w-3.5" />}
          iconTint="bg-[#E7F4EC] text-[#17734E]"
          title="Expectations"
        >
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
