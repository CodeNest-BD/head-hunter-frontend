import type { ReactNode } from "react";
import { Wallet } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { US_STATE_NAME_BY_CODE } from "@/shared/data/usStatesGeo";
import { CompanyLogo } from "@/shared/ui-components/data/CompanyLogo";
import { RichTextView } from "@/shared/ui-components/data/RichTextView";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatMinor } from "@/shared/utils/money";

import { formatSalaryRange } from "../utils/formatSalaryRange";
import {
  BENEFIT_CHECKBOXES,
  EMPLOYMENT_TYPE_LABELS,
  INTERVIEW_TYPE_LABELS,
  OFFER_TIMELINE_LABELS,
  OTHER_SOURCING_LABELS,
  ROLE_CATEGORY_LABELS,
  interviewDurationLabel,
  type Benefits,
  type EmploymentType,
  type InterviewStage,
  type InterviewType,
  type InterviewingAvailability,
  type OfferTimeline,
  type OtherSourcing,
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
  // admins see who's hiring), absent on a company's own job (it already knows
  // whose it is), so all three are optional.
  companyProfileId?: string;
  companyName?: string | null;
  hasLogo?: boolean;
  // From the intake questionnaire. Optional and empty-by-default: a job posted
  // before the questionnaire existed simply shows none of these blocks.
  offerTimeline?: OfferTimeline | null;
  mustHave?: string[];
  niceToHave?: string[];
  interviewProcess?: InterviewStage[];
  // Authed surfaces only — the public card and detail never carry these, so a
  // guest cannot read a company's worksite address or hiring intel.
  worksiteAddress?: string;
  daysAndHours?: string;
  reportsTo?: string;
  benefits?: Benefits;
  interviewingAvailability?: InterviewingAvailability;
  postedOnlineElsewhere?: boolean;
  otherSourcing?: OtherSourcing;
}

/** The micro-label above every block — the panel's one heading style. */
function BlockLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
      {children}
    </p>
  );
}

/** Company, title, and the one-line where-and-what beneath it. */
function JobHeader({ job }: { job: JobView }) {
  const title = job.title.trim();
  // The stored value is a USPS code; recruiters read the state's name.
  const state =
    job.locationState === null
      ? null
      : (US_STATE_NAME_BY_CODE[job.locationState] ?? job.locationState);
  const place =
    [job.locationCity, state].filter(Boolean).join(", ") ||
    (job.isRemote ? "" : "Location TBC");
  const workModel = job.isRemote ? "Remote" : "On-site";
  const where = place === "" ? workModel : `${place} (${workModel})`;

  const facts = [
    job.employmentType
      ? EMPLOYMENT_TYPE_LABELS[job.employmentType as EmploymentType]
      : null,
    ROLE_CATEGORY_LABELS[job.roleCategory as RoleCategory],
    job.publishedAt
      ? `Posted ${formatDistanceToNow(job.publishedAt, { addSuffix: true })}`
      : null,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-3">
      {job.companyName ? (
        <div className="flex items-center gap-2.5">
          <CompanyLogo
            companyProfileId={job.companyProfileId ?? ""}
            hasLogo={job.hasLogo ?? false}
            name={job.companyName}
            size="sm"
          />
          <p className="min-w-0 truncate font-heading text-sm font-bold text-navy">
            {job.companyName}
          </p>
        </div>
      ) : null}
      <div>
        {/* Only a draft-in-progress reaches here untitled, and a blank heading
            reads as a broken page on either surface. */}
        <h2
          className={cn(
            "font-heading text-xl font-extrabold tracking-tight",
            title === "" ? "text-muted-foreground/60" : "text-navy",
          )}
        >
          {title === "" ? "Untitled role" : title}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{where}</p>
        {facts.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {facts.join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * A bordered block. `preview` tightens the padding for the sidebar, where the
 * panel already supplies its own.
 */
function Card({
  preview,
  className,
  children,
}: {
  preview?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-md border border-border bg-card shadow-card",
        preview ? "p-4" : "p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

/**
 * The money strip: the fee that decides whether a recruiter works the role, and
 * beside it the band and urgency they pitch the candidate on. Three cells side
 * by side on the full page; stacked in the sidebar, whose width the viewport-
 * based breakpoints cannot see.
 */
function MoneyStrip({ job, preview }: { job: JobView; preview?: boolean }) {
  const salary = formatSalaryRange({
    salaryMinMinor: job.salaryMinMinor,
    salaryMaxMinor: job.salaryMaxMinor,
    salaryRatePeriod: job.salaryRatePeriod ?? null,
  });

  return (
    <div
      className={cn(
        "grid divide-y divide-border overflow-hidden rounded-md border border-border bg-card shadow-card",
        !preview && "sm:grid-cols-3 sm:divide-x sm:divide-y-0",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 bg-accent/40",
          preview ? "p-4" : "p-5",
        )}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-card text-primary shadow-sm">
          <Wallet className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <BlockLabel>Recruiter fee</BlockLabel>
          <p className="font-heading text-2xl font-extrabold tabular-nums text-navy">
            {formatMinor(job.recruiterFeeMinor)}
          </p>
          <p className="text-xs text-muted-foreground">on a successful hire</p>
        </div>
      </div>
      <div
        className={cn("flex flex-col justify-center", preview ? "p-4" : "p-5")}
      >
        <BlockLabel>Pay range</BlockLabel>
        <p className="mt-1 font-heading text-lg font-bold text-primary">
          {salary ?? "—"}
        </p>
      </div>
      <div
        className={cn("flex flex-col justify-center", preview ? "p-4" : "p-5")}
      >
        <BlockLabel>Timeline to hire</BlockLabel>
        {job.offerTimeline ? (
          <span className="mt-1.5 inline-flex w-fit items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
            {OFFER_TIMELINE_LABELS[job.offerTimeline]}
          </span>
        ) : (
          <p className="mt-1 font-medium text-muted-foreground">—</p>
        )}
      </div>
    </div>
  );
}

/** One requirement group as a pill row; renders nothing when the list is empty
 * so a job that skipped the questionnaire shows no hollow heading. */
function RequirementRow({
  label,
  entries,
}: {
  label: string;
  entries: string[];
}) {
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <BlockLabel>{label}</BlockLabel>
      <ul className="flex flex-wrap gap-2">
        {entries.map((entry) => (
          <li
            key={entry}
            className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
          >
            {entry}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The benefits the company ticked, as one readable line. */
function benefitsLine(benefits: Benefits): string {
  const named = BENEFIT_CHECKBOXES.filter(
    (benefit) => benefits[benefit.key],
  ).map((benefit) => benefit.label);
  if (benefits.retirement401k.offered) {
    const match = benefits.retirement401k.matchPercent;
    named.push(match === undefined ? "401(k)" : `401(k) (${match}% match)`);
  }
  if (benefits.ancillary) {
    named.push(
      benefits.ancillaryDetails
        ? `Ancillary: ${benefits.ancillaryDetails}`
        : "Ancillary benefits",
    );
  }
  return named.join(" · ");
}

/** How soon the company can start interviewing, ASAP or a window. */
function availabilityLine(availability: InterviewingAvailability): string {
  if (availability.asap) return "ASAP";
  const window = [availability.from, availability.to].filter(Boolean);
  return window.length === 2 ? window.join(" – ") : (window[0] ?? "");
}

/** The operational half of the intake: how they interview and what the job is
 * like day to day. Sits below the pitch, which is what a recruiter reads first. */
function HiringProcessCard({
  job,
  preview,
}: {
  job: JobView;
  preview?: boolean;
}) {
  const rounds = job.interviewProcess ?? [];
  const benefits = job.benefits ? benefitsLine(job.benefits) : "";
  const availability = job.interviewingAvailability
    ? availabilityLine(job.interviewingAvailability)
    : "";
  const details: ReadonlyArray<{ label: string; value: string }> = [
    { label: "Worksite", value: job.worksiteAddress ?? "" },
    { label: "Days & hours", value: job.daysAndHours ?? "" },
    { label: "Reports to", value: job.reportsTo ?? "" },
    { label: "Benefits", value: benefits },
    { label: "Interviewing from", value: availability },
    {
      label: "Posted online elsewhere",
      value:
        job.postedOnlineElsewhere === undefined
          ? ""
          : job.postedOnlineElsewhere
            ? "Yes"
            : "No",
    },
    {
      label: "Other sourcing",
      value: job.otherSourcing ? OTHER_SOURCING_LABELS[job.otherSourcing] : "",
    },
  ].filter((detail) => detail.value !== "");

  if (rounds.length === 0 && details.length === 0) return null;

  return (
    <Card preview={preview} className="flex flex-col gap-5">
      {rounds.length > 0 && (
        <div className="flex flex-col gap-2">
          <BlockLabel>Interview process</BlockLabel>
          <ol className="flex flex-col gap-1.5">
            {rounds.map((round, index) => (
              <li key={round.order} className="text-sm text-navy">
                <span className="font-medium">{index + 1}.</span>{" "}
                {INTERVIEW_TYPE_LABELS[round.type as InterviewType] ??
                  round.type}
                <span className="text-muted-foreground">
                  {" · "}
                  {interviewDurationLabel(round.durationMinutes)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {details.length > 0 && (
        <dl
          className={cn(
            "grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2",
            !preview && "lg:grid-cols-3",
          )}
        >
          {details.map((detail) => (
            <div key={detail.label} className="min-w-0">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {detail.label}
              </dt>
              <dd className="mt-0.5 text-sm text-navy">{detail.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </Card>
  );
}

/** The role as the company wrote it. Only rendered when there is something to
 * show, or on the published page, where silence would read as a bug. */
function Description({ description }: { description: string | null }) {
  if (!description) {
    return (
      <p className="text-sm text-muted-foreground">
        No description provided for this role.
      </p>
    );
  }
  return <RichTextView value={description} />;
}

/**
 * The recruiter-facing job body, shared by the real detail page and the
 * create/edit sidebar preview so the two can never drift. When a `cta` is given
 * (the signed-in recruiter's submit action) it sits in a sticky sidebar beside
 * the body.
 */
export function JobDetailBody({
  job,
  cta,
  actions,
  preview,
}: {
  job: JobView;
  cta?: ReactNode;
  /** Owner controls (edit, publish) shown beside the title. */
  actions?: ReactNode;
  /** Sidebar rendering: tighter padding, a stacked money strip (viewport
   * breakpoints cannot see the sidebar's width), and no empty-description card. */
  preview?: boolean;
}) {
  const hasRequirements =
    (job.mustHave?.length ?? 0) > 0 || (job.niceToHave?.length ?? 0) > 0;
  // A draft with nothing written yet shows no card at all; the published page
  // still says so explicitly.
  const showDescription = (job.description ?? "").trim() !== "" || !preview;

  const body = (
    <div className="flex flex-col gap-5">
      <Card preview={preview}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <JobHeader job={job} />
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      </Card>
      <MoneyStrip job={job} preview={preview} />
      {hasRequirements && (
        <Card preview={preview} className="flex flex-col gap-5">
          <RequirementRow label="Must-Haves" entries={job.mustHave ?? []} />
          <RequirementRow
            label="Nice-to-Haves"
            entries={job.niceToHave ?? []}
          />
        </Card>
      )}
      {showDescription && (
        <Card preview={preview} className="flex flex-col gap-3">
          <BlockLabel>Description</BlockLabel>
          <Description description={job.description} />
        </Card>
      )}
      <HiringProcessCard job={job} preview={preview} />
    </div>
  );

  if (!cta) return body;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      {body}
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
  );
}
