import type { ReactNode } from "react";
import { ChevronRight, Wallet } from "lucide-react";

import { US_STATE_NAME_BY_CODE } from "@/shared/data/usStatesGeo";
import { cn } from "@/shared/libs/shadCnConfig";
import { Pill, type PillTone } from "@/shared/ui-components/badges/Pill";
import { Tag } from "@/shared/ui-components/badges/Tag";
import { CompanyLogo } from "@/shared/ui-components/data/CompanyLogo";
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
  formatDaysAndHours,
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

/** Label + semantic tone for the status pill in the preview header. */
const STATUS_BADGE: Record<JobStatus, { label: string; tone: PillTone }> = {
  draft: { label: "Draft", tone: "warn" },
  published: { label: "Published", tone: "ok" },
  paused: { label: "Paused", tone: "warn" },
  filled: { label: "Filled", tone: "info" },
  closed: { label: "Closed", tone: "neutral" },
  expired: { label: "Expired", tone: "bad" },
};

function BlockLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-label font-[650] uppercase text-ink-muted">{children}</p>
  );
}

/** A pill row; renders nothing when empty so no hollow heading appears. */
function PillRow({ label, entries }: { label: string; entries: string[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <BlockLabel>{label}</BlockLabel>
      <ul className="flex flex-wrap gap-1.5">
        {entries.map((entry) => (
          <li key={entry}>
            <Tag>{entry}</Tag>
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

/** The schedule, once it is whole — a half-picked one has nothing to show. */
function scheduleLine(schedule: JobFormValues["daysAndHours"]): string {
  if (
    schedule.days.length === 0 ||
    schedule.startHour === "" ||
    schedule.endHour === ""
  ) {
    return "";
  }
  return formatDaysAndHours({
    days: schedule.days,
    startHour: Number(schedule.startHour),
    endHour: Number(schedule.endHour),
  });
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
    { label: "Days & Hours", value: scheduleLine(values.daysAndHours) },
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
    <div className="flex flex-col overflow-hidden rounded-md border border-line bg-surface shadow-e1">
      <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-label font-[650] uppercase text-ink-muted">
            Recruiter view preview
          </p>
          <p className="text-[11px] text-ink-faint">
            How this role appears to recruiters
          </p>
        </div>
        <Pill tone={badge.tone} className="shrink-0">
          {badge.label}
        </Pill>
        <button
          type="button"
          onClick={onCollapse}
          aria-label="Collapse preview"
          className="flex size-7 shrink-0 items-center justify-center rounded-xs text-ink-faint transition-colors hover:bg-surface-sunken hover:text-ink"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="flex flex-col gap-4 p-4">
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
              <p className="min-w-0 truncate text-sub font-semibold text-ink">
                {values.companyName}
              </p>
            </div>
          )}
          <div>
            <h2
              className={cn(
                "text-card font-[650]",
                title === "" ? "text-ink-faint" : "text-ink",
              )}
            >
              {title === "" ? "Untitled role" : title}
            </h2>
            <p className="mt-0.5 text-sub text-ink-muted">{where}</p>
            {facts.length > 0 && (
              <p className="mt-1 text-meta text-ink-faint">
                {facts.join(" · ")}
              </p>
            )}
          </div>
        </div>

        {/* The reference leads the preview with a cobalt-tinted `.well`: the
            fee is the one figure a recruiter reads before anything else. */}
        <div className="flex flex-col divide-y divide-line overflow-hidden rounded-sm border border-tint-strong">
          <div className="flex items-center gap-3 bg-tint p-3.5">
            <span className="flex size-8.5 shrink-0 items-center justify-center rounded-sm bg-surface text-blue">
              <Wallet className="size-[17px]" />
            </span>
            <div className="min-w-0">
              <BlockLabel>Recruiter fee</BlockLabel>
              <p className="text-stat font-bold tabular-nums text-ink">
                {formatMinor(majorInputToMinor(values.recruiterFee) ?? 0)}
              </p>
              <p className="text-meta text-ink-muted">on a successful hire</p>
            </div>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 bg-surface p-3.5">
            <div className="min-w-0">
              <BlockLabel>Pay range</BlockLabel>
              <p className="mt-[3px] text-block font-[650] tabular-nums text-ink">
                {salary ?? "—"}
              </p>
            </div>
            <div className="min-w-0">
              <BlockLabel>Timeline to hire</BlockLabel>
              {values.timelineToHire === "" ? (
                <p className="mt-[3px] text-body font-[550] text-ink-muted">—</p>
              ) : (
                <div className="mt-1.5">
                  <Pill tone="warn" plain>
                    {OFFER_TIMELINE_LABELS[values.timelineToHire]}
                  </Pill>
                </div>
              )}
            </div>
          </div>
        </div>

        <PillRow label="Must-Haves" entries={values.mustHave} />
        <PillRow label="Nice-to-Haves" entries={values.niceToHave} />

        {selectionKeys.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <BlockLabel>Hiring decision keys</BlockLabel>
            <ol className="flex flex-col gap-1">
              {selectionKeys.map((entry, index) => (
                <li key={entry} className="text-sub text-ink-body">
                  <span className="font-[550] tabular-nums text-ink">
                    {index + 1}.
                  </span>{" "}
                  {entry}
                </li>
              ))}
            </ol>
          </div>
        )}

        {values.benefitsSummary.trim() !== "" && (
          <div className="flex flex-col gap-1.5">
            <BlockLabel>Benefits summary</BlockLabel>
            <p className="whitespace-pre-line text-sub text-ink-body">
              {values.benefitsSummary}
            </p>
          </div>
        )}

        {values.interviewRounds.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <BlockLabel>Interview process</BlockLabel>
            <ol className="flex flex-col gap-1.5">
              {values.interviewRounds.map((round, index) => (
                <li key={index} className="text-sub text-ink-body">
                  <span className="font-[550] tabular-nums text-ink">
                    {index + 1}.
                  </span>{" "}
                  {INTERVIEW_TYPE_LABELS[round.type]}
                  <span className="text-ink-muted">
                    {" · "}
                    {interviewDurationLabel(Number(round.durationMinutes))}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {details.length > 0 && (
          <dl className="grid grid-cols-2 gap-x-5 gap-y-3.5 border-t border-line pt-4">
            {details.map((detail) => (
              <div key={detail.label} className="min-w-0">
                <dt className="text-label font-[650] uppercase text-ink-muted">
                  {detail.label}
                </dt>
                <dd className="mt-[3px] text-body font-[550] text-ink">
                  {detail.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
