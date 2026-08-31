"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";

import { useIsTruncated } from "@/shared/hooks/useIsTruncated";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui-components/controls/tooltip";
import { CompanyLogo } from "@/shared/ui-components/data/CompanyLogo";
import { formatMinor } from "@/shared/utils/money";

import type { PublicJobCard as PublicJobCardData } from "../publicSchemas";
import {
  EMPLOYMENT_TYPE_LABELS,
  OFFER_TIMELINE_SHORT_LABELS,
  ROLE_CATEGORY_LABELS,
  type EmploymentType,
  type RoleCategory,
} from "../schemas";
import { formatSalaryRange } from "../utils/formatSalaryRange";

function locationLine(job: PublicJobCardData): string {
  if (job.isRemote) return "Remote";
  const parts = [job.locationCity, job.locationState].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Location flexible";
}

function categoryLabel(roleCategory: string): string {
  return ROLE_CATEGORY_LABELS[roleCategory as RoleCategory] ?? "Other";
}

/** Compact "2d ago" relative time for the card's corner. */
function postedAgo(date: Date | null): string {
  if (!date) return "";
  const ms = Date.now() - date.getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/**
 * The pills under the location: employment type and work mode, then the two
 * intake facts a recruiter triages on — how soon the company hires, and how
 * many interviews it takes. The last two only appear when the company said.
 */
function tags(job: PublicJobCardData): string[] {
  const out: string[] = [];
  if (job.employmentType) {
    out.push(
      EMPLOYMENT_TYPE_LABELS[job.employmentType as EmploymentType] ??
        job.employmentType,
    );
  }
  out.push(job.isRemote ? "Remote" : "On-site");
  if (job.offerTimeline) {
    out.push(OFFER_TIMELINE_SHORT_LABELS[job.offerTimeline]);
  }
  if (job.interviewCount > 0) {
    out.push(
      `${job.interviewCount} ${job.interviewCount === 1 ? "Interview" : "Interviews"}`,
    );
  }
  return out;
}

/**
 * One job card in the public explore grid, per the client reference: a
 * category eyebrow and posted time, the title, company and location, work tags,
 * then a footer with the salary range, the bold recruiter fee ("Free" at $0)
 * and a View details action.
 */
export function PublicJobCard({ job }: { job: PublicJobCardData }) {
  const isFree = job.recruiterFeeMinor === 0;
  const posted = postedAgo(job.publishedAt);
  const salary = formatSalaryRange(job);
  const { ref: titleRef, isTruncated: isTitleTruncated } =
    useIsTruncated<HTMLHeadingElement>();
  const [isTitleRevealed, setIsTitleRevealed] = useState(false);

  return (
    <article className="flex h-full flex-col rounded-md border border-brand-line bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex w-fit rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-brand-secondary">
          {categoryLabel(job.roleCategory)}
        </span>
        {posted && (
          <span className="shrink-0 text-xs text-brand-gray-light">
            {posted}
          </span>
        )}
      </div>

      {/* Clamped so one long title can't stretch every card in its row. Past
       * two lines the rest is a hover, a tap or a focus away, and the tooltip
       * is offered solely when there is genuinely something hidden. */}
      <TooltipProvider delayDuration={150}>
        <Tooltip
          open={isTitleTruncated && isTitleRevealed}
          onOpenChange={setIsTitleRevealed}
        >
          <TooltipTrigger asChild>
            <h3
              ref={titleRef}
              // Touch has no hover: a tap is the only way to reach the rest of
              // the title on a phone or tablet, and the tab stop is the
              // keyboard equivalent. Neither is offered on a title that fits.
              tabIndex={isTitleTruncated ? 0 : undefined}
              onClick={() => setIsTitleRevealed(true)}
              className="mt-3 line-clamp-2 font-heading text-lg font-extrabold leading-snug text-navy outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {job.title}
            </h3>
          </TooltipTrigger>
          <TooltipContent>{job.title}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {/* Company and location each keep their own row. Wrapping them together
       * put the location beside the company on one card and beneath it on the
       * next, which is the bulk of what read as ragged across a row. */}
      <div className="mt-1.5 flex flex-col gap-1 text-sm text-brand-gray">
        <span className="flex min-w-0 items-center gap-2">
          <CompanyLogo
            companyProfileId={job.companyProfileId}
            hasLogo={job.hasLogo}
            name={job.companyName}
            size="xs"
          />
          <span className="truncate">{job.companyName}</span>
        </span>
        <span className="flex min-w-0 items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{locationLine(job)}</span>
        </span>
      </div>

      {/* `mt-auto` belongs here rather than on the footer: the slack left by a
       * one- versus three-line title collects above the tags, so the tag row —
       * and the divider under it — sit at the same height on every card in a
       * row instead of floating up behind a short title. */}
      <div className="mt-auto flex flex-wrap gap-2 pt-3">
        {tags(job).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-[#F1F3F5] px-2.5 py-0.5 text-xs font-medium text-[#616676]"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Stacked, so the money lines get the card's full width: in the two- and
       * three-column grids a card is ~290–470px, which is not enough to sit a
       * salary range, a fee and the action on one row without clipping. The
       * reference side-by-side footer returns once the columns are wide
       * enough for it. */}
      <div className="mt-3 flex flex-col gap-3 border-t border-brand-line pt-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
        <div className="min-w-0">
          {/* Always one line, stated either way — an omitted salary used to
           * leave a card a line shorter than its neighbours, which pulled its
           * fee and button out of step with theirs. */}
          {salary ? (
            <p className="mb-1.5 text-sm font-bold text-navy">
              {salary}
              <span className="ml-1.5 text-xs font-medium text-brand-gray">
                pay
              </span>
            </p>
          ) : (
            <p className="mb-1.5 text-sm font-medium text-brand-gray-light">
              Pay not disclosed
            </p>
          )}
          <p className="font-heading text-xl font-extrabold leading-none text-primary">
            {isFree ? "Free" : formatMinor(job.recruiterFeeMinor)}
            <span className="ml-1.5 text-sm font-medium text-brand-gray">
              recruiter fee
            </span>
          </p>
          {/* How much competition the role already has. Stated at zero too, so
           * "nobody has submitted yet" is visible rather than inferred from a
           * missing line. */}
          <p className="mt-1.5 text-xs font-medium text-brand-gray">
            {job.submittedCandidates}{" "}
            {job.submittedCandidates === 1
              ? "submitted candidate"
              : "submitted candidates"}
          </p>
        </div>
        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex w-full shrink-0 items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 2xl:w-auto"
        >
          View details
        </Link>
      </div>
    </article>
  );
}
