import type { ReactNode } from "react";
import { ChevronRight, Wallet } from "lucide-react";

import { US_STATE_NAME_BY_CODE } from "@/shared/data/usStatesGeo";
import { cn } from "@/shared/libs/shadCnConfig";
import { CompanyLogo } from "@/shared/ui-components/data/CompanyLogo";
import { RichTextView } from "@/shared/ui-components/data/RichTextView";
import { formatMinor, majorInputToMinor } from "@/shared/utils/money";

import { formatSalaryRange } from "../utils/formatSalaryRange";
import {
  BENEFIT_CHECKBOXES,
  RETIREMENT_BENEFIT_LABEL,
  EMPLOYMENT_TYPE_LABELS,
  INTERVIEW_TYPE_LABELS,
  OFFER_TIMELINE_LABELS,
  OTHER_SOURCING_LABELS,
  POSITION_OPEN_REASON_LABELS,
  ROLE_CATEGORY_LABELS,
  WORK_MODEL_LABELS,
  interviewDurationLabel,
  type JobFormValues,
  type JobStatus,
} from "../schemas";

interface JobLivePreviewProps {
  values: JobFormValues;
  /** The status shown as a badge in the panel header (defaults to a draft). */
  status?: JobStatus;
  /** Collapses the sidebar to its rail (handled by the parent layout). */
  onCollapse: () => void;
}

/** Badge tone + label for the status shown in the preview header. */
const STATUS_BADGE: Record<JobStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-amber-50 text-amber-700" },
  published: {
    label: "Published",
    className: "bg-emerald-50 text-emerald-700",
  },
  paused: { label: "Paused", className: "bg-amber-50 text-amber-700" },
  filled: { label: "Filled", className: "bg-primary/10 text-primary" },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground" },
  expired: { label: "Expired", className: "bg-red-50 text-red-700" },
};

function BlockLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
      {children}
    </p>
  );
}

/** A pill row; renders nothing when empty so no hollow heading appears. */
function PillRow({ label, entries }: { label: string; entries: string[] }) {
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
function benefitsLine(benefits: JobFormValues["benefits"]): string {
  const named: string[] = [];
  for (const benefit of BENEFIT_CHECKBOXES) {
    if (!benefits[benefit.key]) continue;
    const days =
      benefit.key === "vacation"
        ? benefits.vacationDays
        : benefit.key === "sickTime"
          ? benefits.sickDays
          : "";
    named.push(days === "" ? benefit.label : `${benefit.label} (${days} days)`);
  }
  if (benefits.retirement401k) {
    named.push(
      benefits.retirement401kMatch === ""
        ? RETIREMENT_BENEFIT_LABEL
        : `${RETIREMENT_BENEFIT_LABEL} (${benefits.retirement401kMatch}% match)`,
    );
  }
  if (benefits.educationReimbursement) named.push("Education Reimbursement");
  if (benefits.ancillary) {
    named.push(
      benefits.ancillaryDetails === ""
        ? "Other Benefits"
        : `Other: ${benefits.ancillaryDetails}`,
    );
  }
  return named.join(" · ");
}

/** How soon the company can start interviewing, ASAP or a window. */
function availabilityLine(values: JobFormValues): string {
  if (values.interviewingAsap) return "ASAP";
  const window = [values.interviewingFrom, values.interviewingTo].filter(
    (part) => part !== "",
  );
  return window.length === 2 ? window.join(" – ") : (window[0] ?? "");
}

/**
 * A live, read-only rendering of the job as recruiters will see it, driven
 * straight off the form's current values.
 *
 * Deliberately its own renderer rather than the real detail page's
 * `JobDetailBody`: the panel is a narrow sidebar with its own compact layout,
 * and the detail page is not this branch's concern.
 */
export function JobLivePreview({
  values,
  status = "draft",
  onCollapse,
}: JobLivePreviewProps) {
  const badge = STATUS_BADGE[status];
  const title = values.title.trim();

  const state =
    values.locationState === ""
      ? ""
      : (US_STATE_NAME_BY_CODE[values.locationState] ?? values.locationState);
  const place = [values.locationCity, state].filter(Boolean).join(", ");
  const model = WORK_MODEL_LABELS[values.workModel];
  const onsite =
    values.workModel === "hybrid" && values.onsiteDaysPerWeek !== ""
      ? `${model}, ${values.onsiteDaysPerWeek} days on site`
      : model;
  const where = place === "" ? onsite : `${place} (${onsite})`;

  const facts = [
    values.employmentType === ""
      ? null
      : EMPLOYMENT_TYPE_LABELS[values.employmentType],
    values.roleCategory === ""
      ? null
      : ROLE_CATEGORY_LABELS[values.roleCategory],
  ].filter(Boolean);

  const salary = formatSalaryRange({
    salaryMinMinor: majorInputToMinor(values.salaryMin),
    salaryMaxMinor: majorInputToMinor(values.salaryMax),
    salaryRatePeriod: values.salaryRatePeriod,
  });

  const details: ReadonlyArray<{ label: string; value: string }> = [
    { label: "Worksite", value: values.worksiteAddress },
    { label: "ZIP", value: values.worksiteZip },
    { label: "Hours", value: values.daysAndHours },
    { label: "Reports to", value: values.reportsTo },
    { label: "Benefits", value: benefitsLine(values.benefits) },
    { label: "Interviewing from", value: availabilityLine(values) },
    {
      label: "Why the role is open",
      value:
        values.positionOpenReason === ""
          ? ""
          : POSITION_OPEN_REASON_LABELS[values.positionOpenReason] +
            (values.positionOpenReason === "replacing_current" &&
            values.confidentialSearch
              ? " (confidential)"
              : ""),
    },
    {
      label: "Posted online elsewhere",
      value:
        values.postedOnline === ""
          ? ""
          : values.postedOnline === "yes"
            ? "Yes"
            : "No",
    },
    {
      label: "Other sourcing",
      value:
        values.otherSourcing === ""
          ? ""
          : OTHER_SOURCING_LABELS[values.otherSourcing],
    },
  ].filter((detail) => detail.value.trim() !== "");

  const selectionKeys = values.selectionKeys.filter(
    (entry) => entry.trim() !== "",
  );

  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-border bg-card shadow-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Recruiter view preview
          </p>
          <p className="text-[11px] text-muted-foreground">
            How this role appears to recruiters
          </p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
            badge.className,
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
          {badge.label}
        </span>
        <button
          type="button"
          onClick={onCollapse}
          aria-label="Collapse preview"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-5 bg-muted/30 p-4 sm:p-5">
        <div className="flex flex-col gap-3">
          {values.companyName !== "" && (
            <div className="flex items-center gap-2.5">
              {/* No profile id on an unsaved draft, so this is the initials
                  avatar rather than the uploaded logo. */}
              <CompanyLogo
                companyProfileId=""
                hasLogo={false}
                name={values.companyName}
                size="sm"
              />
              <p className="min-w-0 truncate font-heading text-sm font-bold text-navy">
                {values.companyName}
              </p>
            </div>
          )}
          <div>
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

        <div className="flex flex-col divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
          <div className="flex items-center gap-3 bg-accent/40 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-card text-primary shadow-sm">
              <Wallet className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <BlockLabel>Recruiter fee</BlockLabel>
              <p className="font-heading text-2xl font-extrabold tabular-nums text-navy">
                {formatMinor(majorInputToMinor(values.recruiterFee) ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                on a successful hire
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 p-4">
            <div className="min-w-0">
              <BlockLabel>Pay range</BlockLabel>
              <p className="mt-1 font-heading text-lg font-bold text-primary">
                {salary ?? "—"}
              </p>
            </div>
            <div className="min-w-0">
              <BlockLabel>Timeline to hire</BlockLabel>
              {values.timelineToHire === "" ? (
                <p className="mt-1 font-medium text-muted-foreground">—</p>
              ) : (
                <span className="mt-1.5 inline-flex w-fit items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                  {OFFER_TIMELINE_LABELS[values.timelineToHire]}
                </span>
              )}
            </div>
          </div>
        </div>

        <PillRow label="Must-Haves" entries={values.mustHave} />
        <PillRow label="Nice-to-Haves" entries={values.niceToHave} />

        {values.description.trim() !== "" && (
          <div className="flex flex-col gap-2">
            <BlockLabel>Position Details</BlockLabel>
            <RichTextView value={values.description} />
          </div>
        )}

        {selectionKeys.length > 0 && (
          <div className="flex flex-col gap-2">
            <BlockLabel>Hiring decision keys</BlockLabel>
            <ol className="flex flex-col gap-1">
              {selectionKeys.map((entry, index) => (
                <li key={entry} className="text-sm text-navy">
                  <span className="font-medium">{index + 1}.</span> {entry}
                </li>
              ))}
            </ol>
          </div>
        )}

        {values.benefitsSummary.trim() !== "" && (
          <div className="flex flex-col gap-2">
            <BlockLabel>Benefits summary</BlockLabel>
            <p className="whitespace-pre-line text-sm text-navy">
              {values.benefitsSummary}
            </p>
          </div>
        )}

        {values.interviewRounds.length > 0 && (
          <div className="flex flex-col gap-2">
            <BlockLabel>Interview process</BlockLabel>
            <ol className="flex flex-col gap-1.5">
              {values.interviewRounds.map((round, index) => (
                <li key={index} className="text-sm text-navy">
                  <span className="font-medium">{index + 1}.</span>{" "}
                  {INTERVIEW_TYPE_LABELS[round.type]}
                  <span className="text-muted-foreground">
                    {" · "}
                    {interviewDurationLabel(Number(round.durationMinutes))}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {details.length > 0 && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 border-t border-border pt-4 sm:grid-cols-2">
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
      </div>
    </div>
  );
}
