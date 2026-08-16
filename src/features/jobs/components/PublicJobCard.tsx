import Link from "next/link";
import { MapPin } from "lucide-react";

import { formatMinor } from "@/shared/utils/money";

import type { PublicJobCard as PublicJobCardData } from "../publicSchemas";
import { ROLE_CATEGORY_LABELS, type RoleCategory } from "../schemas";

function locationLine(job: PublicJobCardData): string {
  if (job.isRemote) return "Remote";
  const parts = [job.locationCity, job.locationState].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Location flexible";
}

function categoryLabel(roleCategory: string): string {
  return ROLE_CATEGORY_LABELS[roleCategory as RoleCategory] ?? "Other";
}

/**
 * One job card in the public explore grid, per the client reference: title,
 * company + location line, the bold recruiter fee, the "paid upon successful
 * hire" note, and a View Details action.
 */
export function PublicJobCard({ job }: { job: PublicJobCardData }) {
  return (
    <article className="flex flex-col rounded-2xl border border-brand-line bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover">
      <span className="mb-3 inline-flex w-fit rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-brand-secondary">
        {categoryLabel(job.roleCategory)}
      </span>
      <h3 className="font-heading text-lg font-extrabold leading-snug text-navy">
        {job.title}
      </h3>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-brand-gray">
        {job.companyName}
        <span aria-hidden="true">·</span>
        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {locationLine(job)}
      </p>
      <p className="mt-4 font-heading text-xl font-extrabold text-navy">
        Recruiter Fee:{" "}
        <span className="text-primary">
          {formatMinor(job.recruiterFeeMinor)}
        </span>
      </p>
      <p className="mt-0.5 text-xs text-brand-gray-light">
        Paid upon successful hire
      </p>
      <Link
        href={`/jobs/${job.id}`}
        className="mt-5 inline-flex items-center justify-center rounded-lg border border-input px-4 py-2.5 text-sm font-bold text-navy transition-colors hover:border-brand-primary hover:text-primary"
      >
        View Details
      </Link>
    </article>
  );
}
