import Link from "next/link";
import { MapPin } from "lucide-react";

import { CompanyLogo } from "@/shared/ui-components/data/CompanyLogo";
import { formatMinor } from "@/shared/utils/money";

import type { PublicJobCard as PublicJobCardData } from "../publicSchemas";
import {
  EMPLOYMENT_TYPE_LABELS,
  ROLE_CATEGORY_LABELS,
  type EmploymentType,
  type RoleCategory,
} from "../schemas";

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

/** The employment type and work mode, as up to two neutral tag pills. */
function tags(job: PublicJobCardData): string[] {
  const out: string[] = [];
  if (job.employmentType) {
    out.push(
      EMPLOYMENT_TYPE_LABELS[job.employmentType as EmploymentType] ??
        job.employmentType,
    );
  }
  out.push(job.isRemote ? "Remote" : "On-site");
  return out;
}

/**
 * One job card in the public explore grid, per the client reference: a
 * category eyebrow and posted time, the title, company and location, work tags,
 * then a footer with the bold recruiter fee ("Free" at $0) and a View details
 * action.
 */
export function PublicJobCard({ job }: { job: PublicJobCardData }) {
  const isFree = job.recruiterFeeMinor === 0;
  const posted = postedAgo(job.publishedAt);

  return (
    <article className="flex h-full flex-col rounded-md border border-brand-line bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover">
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

      <h3 className="mt-3 font-heading text-lg font-extrabold leading-snug text-navy">
        {job.title}
      </h3>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-brand-gray">
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

      <div className="mt-3 flex flex-wrap gap-2">
        {tags(job).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-[#F1F3F5] px-2.5 py-0.5 text-xs font-medium text-[#616676]"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 border-t border-brand-line pt-4">
        <div className="min-w-0">
          <p className="font-heading text-xl font-extrabold leading-none text-primary">
            {isFree ? "Free" : formatMinor(job.recruiterFeeMinor)}
            <span className="ml-1.5 text-sm font-medium text-brand-gray">
              recruiter fee
            </span>
          </p>
          <p className="mt-1 text-xs text-brand-gray-light">
            Paid upon successful hire
          </p>
        </div>
        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex shrink-0 items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          View details
        </Link>
      </div>
    </article>
  );
}
