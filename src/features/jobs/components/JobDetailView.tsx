import type { ReactNode } from "react";
import { Wallet } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { CompanyLogo } from "@/shared/ui-components/data/CompanyLogo";
import { RichTextView } from "@/shared/ui-components/data/RichTextView";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatMinor } from "@/shared/utils/money";

import {
  EMPLOYMENT_TYPE_LABELS,
  ROLE_CATEGORY_LABELS,
  SALARY_RATE_PERIOD_SUFFIX,
  type EmploymentType,
  type RoleCategory,
  type SalaryRatePeriod,
} from "../schemas";

/**
 * The fields the recruiter-facing job display reads. Both an API `Job` and a
 * draft-in-progress (the create/edit form's live values) satisfy this shape,
 * so the real detail page and the form preview render through one renderer and
 * can never drift apart.
 */
export interface JobView {
  title: string;
  roleCategory: string;
  employmentType: string | null;
  locationCity: string | null;
  locationState: string | null;
  isRemote: boolean;
  salaryMinMinor: number | null;
  salaryMaxMinor: number | null;
  salaryRatePeriod?: SalaryRatePeriod | null;
  recruiterFeeMinor: number;
  publishedAt: Date | null;
  description: string | null;
  // Company identity — present on the marketplace/authed job (recruiters,
  // admins see who's hiring), absent on the create/edit preview draft and on a
  // company's own job (it already knows whose it is), so all three are optional.
  companyProfileId?: string;
  companyName?: string | null;
  hasLogo?: boolean;
}

/** One label/value fact in the header card. */
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 truncate font-medium text-navy">{value}</p>
    </div>
  );
}

/**
 * Fee + the role's facts, the strip a recruiter scans first. `compact` stacks
 * the fee block above the facts and never switches to the side-by-side row —
 * for the create/edit preview, which lives in a narrow sidebar where the
 * viewport-based `md:` row layout would otherwise squeeze the facts.
 */
function FactsCard({ job, compact }: { job: JobView; compact?: boolean }) {
  const location = job.isRemote
    ? "Remote"
    : [job.locationCity, job.locationState].filter(Boolean).join(", ") || "—";
  const salary =
    job.salaryMinMinor === null && job.salaryMaxMinor === null
      ? "—"
      : `${formatMinor(job.salaryMinMinor)} – ${formatMinor(job.salaryMaxMinor)}${
          job.salaryRatePeriod
            ? ` ${SALARY_RATE_PERIOD_SUFFIX[job.salaryRatePeriod]}`
            : ""
        }`;
  const employmentType = job.employmentType
    ? (EMPLOYMENT_TYPE_LABELS[job.employmentType as EmploymentType] ?? "—")
    : "—";
  const posted = job.publishedAt
    ? formatDistanceToNow(job.publishedAt, { addSuffix: true })
    : "—";
  const category =
    ROLE_CATEGORY_LABELS[job.roleCategory as RoleCategory] ?? "Other";

  return (
    <div
      className={cn(
        "flex flex-col divide-y divide-border rounded-md border border-border bg-card shadow-card",
        !compact && "md:flex-row md:divide-x md:divide-y-0",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 p-5 sm:p-6",
          !compact && "md:w-72",
        )}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
          <Wallet className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Recruiter fee
          </p>
          <p className="font-heading text-2xl font-extrabold tabular-nums text-navy">
            {formatMinor(job.recruiterFeeMinor)}
          </p>
          <p className="text-xs text-muted-foreground">on a successful hire</p>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-x-6 gap-y-4 p-5 sm:grid-cols-2 sm:p-6">
        <Fact label="Category" value={category} />
        <Fact label="Location" value={location} />
        <Fact label="Salary range" value={salary} />
        <Fact label="Employment type" value={employmentType} />
        <Fact label="Posted" value={posted} />
        <Fact label="Work model" value={job.isRemote ? "Remote" : "On-site"} />
      </div>
    </div>
  );
}

function DescriptionCard({ description }: { description: string | null }) {
  return (
    <section className="rounded-md border border-border bg-card p-5 shadow-card sm:p-6">
      <h2 className="mb-3 font-heading text-lg font-bold tracking-tight text-navy">
        Description
      </h2>
      {description ? (
        <RichTextView value={description} />
      ) : (
        <p className="text-sm text-muted-foreground">
          No description provided for this role.
        </p>
      )}
    </section>
  );
}

/**
 * The recruiter-facing job body: the facts strip plus the description. When a
 * `cta` is given (the signed-in recruiter's submit action) it sits in a sticky
 * sidebar beside the description; otherwise the description spans full width.
 */
export function JobDetailBody({
  job,
  cta,
  compact,
  hideDescription,
}: {
  job: JobView;
  cta?: ReactNode;
  /** Narrow-container layout for the create/edit preview sidebar. */
  compact?: boolean;
  /** Drop the description card — the post-a-job preview doesn't need it. */
  hideDescription?: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      {job.companyName ? (
        <div className="flex items-center gap-3">
          <CompanyLogo
            companyProfileId={job.companyProfileId ?? ""}
            hasLogo={job.hasLogo ?? false}
            name={job.companyName}
            size="md"
          />
          <div className="min-w-0">
            <p className="truncate font-heading text-base font-bold text-navy">
              {job.companyName}
            </p>
            <p className="text-xs text-muted-foreground">Hiring company</p>
          </div>
        </div>
      ) : null}
      <FactsCard job={job} compact={compact} />
      {cta ? (
        <div
          className={
            hideDescription
              ? undefined
              : "grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
          }
        >
          {!hideDescription && (
            <DescriptionCard description={job.description} />
          )}
          <aside className="h-fit lg:sticky lg:top-24">
            <div className="rounded-md border border-border bg-card p-5 shadow-card">
              <h2 className="font-heading text-base font-bold text-navy">
                Ready to submit?
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                Open the workspace to add candidates and message the company.
              </p>
              <div className="mt-4">{cta}</div>
            </div>
          </aside>
        </div>
      ) : hideDescription ? null : (
        <DescriptionCard description={job.description} />
      )}
    </div>
  );
}
