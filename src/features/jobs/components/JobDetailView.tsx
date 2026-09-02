import type { ReactNode } from "react";
import { CircleDollarSign, Gift } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { CompanyLogo } from "@/shared/ui-components/data/CompanyLogo";
import { MoneyBag } from "@/shared/ui-components/icons/MoneyBag";
import { RichTextView } from "@/shared/ui-components/data/RichTextView";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatMinor } from "@/shared/utils/money";

import {
  BENEFIT_CHECKBOXES,
  EMPLOYMENT_TYPE_LABELS,
  INTERVIEW_TYPE_LABELS,
  OFFER_TIMELINE_LABELS,
  OTHER_SOURCING_LABELS,
  POSITION_OPEN_REASON_LABELS,
  RETIREMENT_BENEFIT_LABEL,
  SALARY_RATE_PERIOD_SUFFIX,
  WORK_MODEL_LABELS,
  type Benefits,
  type CompanyDetails,
  type EmploymentType,
  type InterviewStage,
  type InterviewType,
  type InterviewingAvailability,
  type OfferTimeline,
  type OtherSourcing,
  type PositionOpenReason,
  type SalaryRatePeriod,
  type WorkModel,
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
  // From the intake questionnaire. Optional and empty-by-default: a job posted
  // before the questionnaire existed simply shows none of these blocks.
  offerTimeline?: OfferTimeline | null;
  mustHave?: string[];
  niceToHave?: string[];
  interviewProcess?: InterviewStage[];
  // Authed surfaces only — the public card and detail never carry these, so a
  // guest cannot read a company's worksite address or hiring intel.
  worksiteAddress?: string;
  workModel?: WorkModel;
  daysAndHours?: string;
  reportsTo?: string;
  benefits?: Benefits;
  interviewingAvailability?: InterviewingAvailability;
  postedOnlineElsewhere?: boolean;
  otherSourcing?: OtherSourcing;
  positionOpenReason?: PositionOpenReason;
  selectionKeys?: string[];
  companyDetails?: CompanyDetails;
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
  const worksite = job.worksiteAddress?.trim()
    ? [
        job.worksiteAddress,
        [job.locationCity, job.locationState].filter(Boolean).join(", "),
      ]
        .filter(Boolean)
        .join(" · ")
    : location;
  const workModel = job.workModel
    ? WORK_MODEL_LABELS[job.workModel]
    : job.isRemote
      ? "Remote"
      : "On-Site";
  const employmentType = job.employmentType
    ? (EMPLOYMENT_TYPE_LABELS[job.employmentType as EmploymentType] ?? "—")
    : "—";
  const posted = job.publishedAt
    ? formatDistanceToNow(job.publishedAt, { addSuffix: true })
    : "—";
  const rounds = job.interviewProcess ?? [];
  const interviewProcess = rounds
    .map(
      (round) =>
        INTERVIEW_TYPE_LABELS[round.type as InterviewType] ?? round.type,
    )
    .join(" → ");

  // Ordered exactly as the client's spec pairs them across two columns, and
  // every one of them renders: hiding an uncaptured fact reflows the pairs
  // through the row-major grid, so a job with no interview rounds put Posted
  // Online in Interview Process's column.
  const facts = [
    { label: "Worksite Address", value: worksite },
    { label: "Work Model", value: workModel },
    { label: "Posted", value: posted },
    { label: "Employment Type", value: employmentType },
    {
      label: "Start Interviewing",
      value: job.interviewingAvailability
        ? availabilityLine(job.interviewingAvailability)
        : "",
    },
    {
      label: "Make a Hire",
      value: job.offerTimeline ? OFFER_TIMELINE_LABELS[job.offerTimeline] : "",
    },
    { label: "Interview Process", value: interviewProcess },
    {
      label: "Posted Online",
      value:
        job.postedOnlineElsewhere === undefined
          ? ""
          : job.postedOnlineElsewhere
            ? "Yes"
            : "No",
    },
    {
      label: "Other Sourcing",
      value: job.otherSourcing ? OTHER_SOURCING_LABELS[job.otherSourcing] : "",
    },
    {
      label: "Why Open",
      value: job.positionOpenReason
        ? POSITION_OPEN_REASON_LABELS[job.positionOpenReason]
        : "",
    },
  ];

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
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MoneyBag className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Recruiter Fee
          </p>
          <p className="font-heading text-2xl font-extrabold tabular-nums text-navy">
            {formatMinor(job.recruiterFeeMinor)}
          </p>
          <p className="text-xs text-muted-foreground">on a successful hire</p>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-x-6 gap-y-4 p-5 sm:grid-cols-2 sm:p-6">
        {facts.map((fact) => (
          <Fact key={fact.label} label={fact.label} value={fact.value || "—"} />
        ))}
      </div>
    </div>
  );
}

/** The narrow pay + benefits strip that sits between the facts card and the
 * requirements card, per the client's layout. */
function PayBenefitsBox({ job }: { job: JobView }) {
  const hasSalary = job.salaryMinMinor !== null || job.salaryMaxMinor !== null;
  const salaryRange = hasSalary
    ? `${formatMinor(job.salaryMinMinor)} – ${formatMinor(job.salaryMaxMinor)}`
    : "";
  const salaryPeriod = job.salaryRatePeriod
    ? SALARY_RATE_PERIOD_SUFFIX[job.salaryRatePeriod]
    : "";
  const benefits = job.benefits ? benefitsList(job.benefits) : [];
  if (!hasSalary && benefits.length === 0) return null;

  return (
    <div className="flex flex-col gap-5 rounded-md border border-border bg-card p-5 shadow-card sm:flex-row sm:items-stretch sm:gap-6 sm:p-6">
      <div className="flex shrink-0 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CircleDollarSign className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Pay Range
          </p>
          {hasSalary ? (
            <p className="mt-1 whitespace-nowrap font-heading text-lg font-bold leading-snug text-navy">
              <span className="tabular-nums">{salaryRange}</span>
              {salaryPeriod && (
                <span className="ml-1 text-xs font-medium text-muted-foreground">
                  {salaryPeriod}
                </span>
              )}
            </p>
          ) : (
            <p className="mt-1 text-sm text-navy">—</p>
          )}
        </div>
      </div>

      {/* Divider between the two facts so the wide box doesn't read as two items
          stranded at opposite edges. */}
      <div className="hidden w-px shrink-0 self-stretch bg-border sm:block" />

      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Gift className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Benefits
          </p>
          {benefits.length > 0 ? (
            <ul className="mt-1.5 flex flex-wrap gap-2">
              {benefits.map((benefit) => (
                <li
                  key={benefit}
                  className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                >
                  {benefit}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-navy">—</p>
          )}
        </div>
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
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
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

/**
 * The benefits the company ticked, one label per entry (rendered as chips),
 * carrying the day counts and match percentage it quantified — a company that
 * typed "15 days" wants a recruiter to see the 15, not just "Vacation Time".
 */
function benefitsList(benefits: Benefits): string[] {
  const named: string[] = [];
  for (const benefit of BENEFIT_CHECKBOXES) {
    if (!benefits[benefit.key]) continue;
    const days =
      benefit.key === "vacation"
        ? benefits.vacationDays
        : benefit.key === "sickTime"
          ? benefits.sickDays
          : undefined;
    named.push(
      days === undefined
        ? benefit.label
        : `${benefit.label} (${days} ${days === 1 ? "day" : "days"})`,
    );
  }
  if (benefits.retirement401k.offered) {
    const match = benefits.retirement401k.matchPercent;
    named.push(
      match === undefined
        ? RETIREMENT_BENEFIT_LABEL
        : `${RETIREMENT_BENEFIT_LABEL} (${match}% match)`,
    );
  }
  if (benefits.educationReimbursement) named.push("Education Reimbursement");
  if (benefits.ancillary) {
    named.push(
      benefits.ancillaryDetails
        ? `Ancillary: ${benefits.ancillaryDetails}`
        : "Ancillary benefits",
    );
  }
  return named;
}

/** How soon the company can start interviewing, ASAP or a window. */
function availabilityLine(availability: InterviewingAvailability): string {
  if (availability.asap) return "ASAP";
  const window = [availability.from, availability.to].filter(Boolean);
  return window.length === 2 ? window.join(" – ") : (window[0] ?? "");
}

/** The company's short facts. "What they do" is prose and renders separately. */
function companyInfoItems(
  company: CompanyDetails,
): ReadonlyArray<{ label: string; value: string }> {
  const revenue = company.revenue?.trim()
    ? company.revenue.startsWith("$")
      ? company.revenue
      : `$${company.revenue}`
    : "";
  return [
    { label: "Industry", value: company.industry?.trim() ?? "" },
    { label: "Employees", value: company.employeeSize?.trim() ?? "" },
    { label: "Revenue", value: revenue },
    {
      label: "Years in business",
      value: company.yearsInBusiness ? String(company.yearsInBusiness) : "",
    },
  ].filter((item) => item.value !== "");
}

/** A card heading, matching the Job Duties card so every block reads as a peer. */
function CardHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-heading text-lg font-bold tracking-tight text-navy">
      {children}
    </h2>
  );
}

/** What the role demands: must/nice-to-haves and the company's selection keys.
 * (Interview process, benefits, sourcing and posting details live in the
 * facts/pay cards above.) */
function QualificationsCard({ job }: { job: JobView }) {
  const mustHave = job.mustHave ?? [];
  const niceToHave = job.niceToHave ?? [];
  const topKeys = job.selectionKeys ?? [];

  if (
    mustHave.length === 0 &&
    niceToHave.length === 0 &&
    topKeys.length === 0
  ) {
    return null;
  }

  return (
    <section className="flex flex-col gap-5 rounded-md border border-border bg-card p-5 shadow-card sm:p-6">
      <CardHeading>Qualifications</CardHeading>
      <RequirementRow label="Must-Haves" entries={mustHave} />
      <RequirementRow label="Nice-to-Haves" entries={niceToHave} />
      <RequirementRow label="Top 3 Keys" entries={topKeys} />
    </section>
  );
}

/** Who a recruiter would be pitching: the company in its own words, plus the
 * figures that tell a recruiter how big an employer this is. */
function CompanyInfoCard({ job }: { job: JobView }) {
  const items = job.companyDetails ? companyInfoItems(job.companyDetails) : [];
  const whatTheyDo = job.companyDetails?.whatTheyDo?.trim() ?? "";

  if (items.length === 0 && whatTheyDo === "") return null;

  return (
    <section className="flex flex-col gap-4 rounded-md border border-border bg-card p-5 shadow-card sm:p-6">
      <CardHeading>Company Info</CardHeading>
      {whatTheyDo !== "" && (
        <p className="text-sm leading-relaxed text-navy">{whatTheyDo}</p>
      )}
      {items.length > 0 && (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.label} className="min-w-0">
              <dt className="text-xs text-muted-foreground">{item.label}</dt>
              <dd className="mt-0.5 text-sm font-medium text-navy">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

function DescriptionCard({ description }: { description: string | null }) {
  return (
    <section className="rounded-md border border-border bg-card p-5 shadow-card sm:p-6">
      <div className="mb-3">
        <CardHeading>Job Duties</CardHeading>
      </div>
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
      <PayBenefitsBox job={job} />
      <QualificationsCard job={job} />
      <CompanyInfoCard job={job} />
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
