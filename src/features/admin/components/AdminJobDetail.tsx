"use client";

import Link from "next/link";
import { AlertCircle, Lock } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TONE_DOT } from "@/shared/ui-components/badges/Pill";
import {
  TABLE_BODY,
  TABLE_CELL_MAIN,
  TABLE_CELL_SUB,
  TABLE_EL,
  TABLE_HEAD,
  TABLE_ROW,
  TABLE_SCROLL,
  TABLE_TD,
  TABLE_TD_STACKED,
  TABLE_TH,
} from "@/shared/ui-components/data/tableStyles";
import { adminCompanyPath, adminJobEditPath } from "@/shared/utils/entityPaths";
import { formatMinor } from "@/shared/utils/money";
import { useAdminJob } from "../hooks/useAdmin";
import {
  JOB_STATUS_LABELS,
  type AdminJobCandidate,
  type AdminJobComingUp,
  type AdminJobDetail as AdminJobDetailData,
  type AdminJobPipeline,
} from "../schemas";
import { DetailSkeleton, SideFact, SideSection } from "./DetailPrimitives";
import { CANDIDATE_STATUS_TONES, JOB_STATUS_TONES } from "./statusStyles";

/** The design's wording for a submission's state. */
const CANDIDATE_LABELS: Record<string, string> = {
  submitted: "New",
  reviewing: "Reviewing",
  interviewing: "Interviewing",
  offered: "Offer",
  hired: "Hired",
  passed: "Rejected",
};

/**
 * The funnel, left to right. Every step is a real candidate status — the
 * design's "Shortlisted" has no counterpart in the data, so it is not drawn
 * rather than filled with a number that would mean something else.
 */
const STAGES = [
  { key: "submitted", label: "New" },
  { key: "reviewing", label: "Reviewing" },
  { key: "interviewing", label: "Interviewing" },
  { key: "offered", label: "Offer" },
  { key: "hired", label: "Hired" },
] as const;

/**
 * Each step is a step further along the funnel, so the bar reads as progress
 * rather than as five unrelated categories. Written out rather than computed —
 * Tailwind only sees class names that appear whole in the source.
 */
const STAGE_FILL: Record<(typeof STAGES)[number]["key"], string> = {
  submitted: "bg-tint-strong",
  reviewing: "bg-blue/40",
  interviewing: "bg-blue/70",
  offered: "bg-blue",
  hired: "bg-ok-dot",
};

function formatDate(iso: string | Date | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const at = new Date(iso);
  return `${at.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}, ${at.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

/** "under_review" → "Under Review", for the raw states the API sends. */
function titleCaseWords(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function PipelineBar({ pipeline }: { pipeline: AdminJobPipeline }) {
  const total = STAGES.reduce((sum, stage) => sum + pipeline[stage.key], 0);
  return (
    <div className="px-6 pb-4">
      <div
        role="img"
        aria-label={STAGES.map(
          (stage) => `${pipeline[stage.key]} ${stage.label}`,
        ).join(", ")}
        className="mb-3 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-line"
      >
        {STAGES.map((stage) => (
          <div
            key={stage.key}
            className={STAGE_FILL[stage.key]}
            style={{
              width:
                total > 0 ? `${(pipeline[stage.key] / total) * 100}%` : "0%",
            }}
          />
        ))}
      </div>
      <dl className="m-0 grid grid-cols-2 gap-y-2 sm:grid-cols-3 lg:grid-cols-6">
        {STAGES.map((stage) => (
          <div key={stage.key} className="flex items-baseline gap-1.5">
            <dt className="sr-only">{stage.label}</dt>
            <dd className="m-0 text-block font-[650] tabular-nums text-ink">
              {pipeline[stage.key]}
            </dd>
            <dd className="m-0 text-sub text-ink-muted">{stage.label}</dd>
          </div>
        ))}
        <div className="flex items-baseline gap-1.5">
          <dd className="m-0 text-block font-[650] tabular-nums text-ink-muted">
            {pipeline.passed}
          </dd>
          <dd className="m-0 text-sub text-ink-muted">Rejected</dd>
        </div>
      </dl>
    </div>
  );
}

function CandidateRow({ candidate }: { candidate: AdminJobCandidate }) {
  return (
    <tr className={TABLE_ROW}>
      <td className={TABLE_TD_STACKED}>
        <span className={cn(TABLE_CELL_MAIN, "block")}>
          {candidate.candidateName}
        </span>
        <span className={TABLE_CELL_SUB}>
          Submitted {formatDate(candidate.submittedAt)}
        </span>
      </td>
      <td className={cn(TABLE_TD, "whitespace-nowrap text-ink-body")}>
        {candidate.recruiterName}
        <span className="text-ink-muted">
          {candidate.recruiterRatingAvg === null
            ? " · Unrated"
            : ` · ${candidate.recruiterRatingAvg.toFixed(1)}`}
        </span>
      </td>
      <td className={TABLE_TD}>
        <StatusBadge
          label={
            CANDIDATE_LABELS[candidate.status] ??
            titleCaseWords(candidate.status)
          }
          tone={CANDIDATE_STATUS_TONES[candidate.status] ?? "neutral"}
        />
      </td>
      <td className={cn(TABLE_TD, "whitespace-nowrap text-ink-muted")}>
        {formatDate(candidate.lastActivityAt)}
      </td>
    </tr>
  );
}

function ComingUpRow({ item }: { item: AdminJobComingUp }) {
  return (
    <div className="py-2.5 text-sub [&+&]:border-t [&+&]:border-line">
      <span className="block text-ink">
        <span className="font-medium">{item.candidateName}</span>
        {item.kind === "interview"
          ? ` · interview ${formatDateTime(item.at)}`
          : ` · offer ${item.amountMinor === null ? "" : formatMinor(item.amountMinor)}`}
      </span>
      <span
        className={cn(
          "text-meta",
          item.state === "scheduled" ? "text-ok" : "text-warn",
        )}
      >
        {item.kind === "interview"
          ? item.state === "scheduled"
            ? "Confirmed"
            : "Awaiting confirmation"
          : "Awaiting a response"}
      </span>
    </div>
  );
}

/** A `.facts` pair inside the Job details card. */
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-meta text-ink-muted">{label}</dt>
      <dd className="m-0 mt-0.5 text-sub text-ink">{value || "—"}</dd>
    </div>
  );
}

/** A ruled row of the Job details card: a heading and its pairs. */
function DetailRow({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 px-6 py-4 sm:grid-cols-[180px_1fr] [&+&]:border-t [&+&]:border-line">
      <h3 className="text-sub font-[650] text-ink">{title}</h3>
      <dl className="m-0 grid gap-x-6 gap-y-3 sm:grid-cols-2">{children}</dl>
    </div>
  );
}

export function AdminJobDetail({ jobRef }: { jobRef: string }) {
  const { data, isPending, isError, refetch } = useAdminJob(jobRef);

  if (isPending) return <DetailSkeleton />;
  if (isError) {
    return (
      <div className="flex max-w-md flex-col gap-3 rounded-sm border border-bad-line bg-bad-bg p-3.5 text-sub text-bad">
        <div className="flex items-center gap-2.5 font-[550]">
          <AlertCircle className="size-[15px] shrink-0" />
          Could not load this job.
        </div>
        <div>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return <JobBody data={data} />;
}

function JobBody({ data }: { data: AdminJobDetailData }) {
  const intake = data.intake;
  const location =
    [data.locationCity, data.locationState].filter(Boolean).join(", ") || "—";
  const workModel = intake?.workModel
    ? intake.workModel === "hybrid" && intake.onsiteDaysPerWeek
      ? `Hybrid · ${intake.onsiteDaysPerWeek} days on-site`
      : titleCaseWords(intake.workModel)
    : data.isRemote
      ? "Remote"
      : "—";
  const pay =
    data.salaryMinMinor === null || data.salaryMaxMinor === null
      ? "—"
      : `${formatMinor(data.salaryMinMinor)} – ${formatMinor(data.salaryMaxMinor)}`;
  const qualifications = [
    ...(intake?.qualifications?.mustHave ?? []),
    ...(intake?.qualifications?.niceToHave ?? []),
  ].join(", ");
  const companyHref = adminCompanyPath({
    id: data.company.companyUserId,
    serialNumber: data.company.companySerialNumber,
  });
  const submissionsHref = `/admin/submissions?${new URLSearchParams({
    jobId: data.id,
  }).toString()}`;

  return (
    <div className="flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-page font-bold text-ink">{data.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-sub text-ink-muted">
            <span className="inline-flex items-center gap-1.5 text-blue-ink">
              <span
                aria-hidden="true"
                className={cn(
                  "size-1.5 rounded-full",
                  TONE_DOT[JOB_STATUS_TONES[data.status] ?? "neutral"],
                )}
              />
              {JOB_STATUS_LABELS[data.status] ?? data.status}
            </span>
            <Link href={companyHref} className="text-blue-ink hover:underline">
              {data.company.companyName}
            </Link>
            <span>
              {location}
              {workModel !== "—" && ` · ${workModel}`}
            </span>
            <span>Posted {formatDate(data.publishedAt)}</span>
            {data.serialNumber && (
              <span className="tabular-nums">JOB-{data.serialNumber}</span>
            )}
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={submissionsHref}>
            Submissions · {data.conversationCount}
          </Link>
        </Button>
      </header>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[3_1_600px] flex-col gap-6">
          <section className="overflow-hidden rounded-md bg-surface shadow-e1">
            <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4">
              <h2 className="text-card font-[650] text-ink">Hiring pipeline</h2>
              <p className="m-0 text-sub text-ink-muted">
                {data.conversationCount} candidate
                {data.conversationCount === 1 ? "" : "s"} from{" "}
                {data.pipeline.recruiterCount} recruiter
                {data.pipeline.recruiterCount === 1 ? "" : "s"} · current status
                of each
              </p>
            </div>
            <PipelineBar pipeline={data.pipeline} />
            {data.candidates.length === 0 ? (
              <p className="px-6 pb-6 text-sub text-ink-muted">
                No candidates have been submitted to this job yet.
              </p>
            ) : (
              <>
                <div className={TABLE_SCROLL}>
                  <table className={TABLE_EL}>
                    <thead className={TABLE_HEAD}>
                      <tr>
                        <th scope="col" className={TABLE_TH}>
                          Candidate
                        </th>
                        <th scope="col" className={TABLE_TH}>
                          Recruiter
                        </th>
                        <th scope="col" className={TABLE_TH}>
                          Status
                        </th>
                        <th scope="col" className={TABLE_TH}>
                          Latest Activity
                        </th>
                      </tr>
                    </thead>
                    <tbody className={TABLE_BODY}>
                      {data.candidates.map((candidate) => (
                        <CandidateRow
                          key={candidate.candidateId}
                          candidate={candidate}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-3.5">
                  <Link
                    href={submissionsHref}
                    className="text-sub font-medium text-blue-ink hover:underline"
                  >
                    All {data.conversationCount} submissions →
                  </Link>
                </div>
              </>
            )}
          </section>

          <section className="overflow-hidden rounded-md bg-surface shadow-e1">
            <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4">
              <h2 className="text-card font-[650] text-ink">Job details</h2>
              <Button asChild variant="outline" size="sm">
                <Link
                  href={adminJobEditPath({
                    id: data.id,
                    serialNumber: data.serialNumber,
                  })}
                >
                  Edit details
                </Link>
              </Button>
            </div>
            <div className="border-t border-line">
              <DetailRow title="Basics">
                <Fact label="Job title" value={data.title} />
                <Fact
                  label="Employment type"
                  value={
                    data.employmentType
                      ? titleCaseWords(data.employmentType)
                      : ""
                  }
                />
                <Fact label="Reports to" value={intake?.reportsTo ?? ""} />
                <Fact label="Company" value={data.company.companyName} />
              </DetailRow>
              <DetailRow title="Location">
                <Fact label="Office" value={location} />
                <Fact label="Work model" value={workModel} />
              </DetailRow>
              <DetailRow title="Compensation & benefits">
                <Fact label="Pay range" value={pay} />
                <Fact label="Benefits" value={intake?.benefitsSummary ?? ""} />
              </DetailRow>
              <DetailRow title="Position details">
                <Fact label="Duties" value={data.description ?? ""} />
                <Fact label="Qualifications" value={qualifications} />
              </DetailRow>
              <DetailRow title="Timeline & schedule">
                <Fact
                  label="Hiring timeline"
                  value={
                    intake?.offerTimeline
                      ? titleCaseWords(intake.offerTimeline)
                      : ""
                  }
                />
                <Fact
                  label="Worksite address"
                  value={intake?.worksiteAddress ?? ""}
                />
              </DetailRow>
            </div>
          </section>
        </div>

        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <div className="rounded-md bg-surface shadow-e1">
            <SideSection title="Recruiter Fee">
              <p className="m-0 mb-3 text-[26px] font-semibold leading-8 tracking-[-0.02em] tabular-nums text-blue-ink">
                {formatMinor(data.recruiterFeeMinor)}
              </p>
              <dl className="m-0 flex flex-col gap-2.5">
                <SideFact
                  label="Reserved from wallet"
                  value={
                    data.reservedMinor > 0
                      ? formatMinor(data.reservedMinor)
                      : "Not reserved"
                  }
                />
                <SideFact
                  label="Reservation"
                  value={
                    data.reservedMinor > 0 ? "Held for this job" : "Released"
                  }
                />
              </dl>
              <p className="mb-0 mt-3 flex gap-2 text-meta leading-[18px] text-ink-muted">
                <Lock className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                Contractual. Not editable from job details; fee changes go
                through the company&rsquo;s job edit flow.
              </p>
            </SideSection>

            <SideSection title="Status & Publishing">
              <dl className="m-0 flex flex-col gap-2.5">
                <SideFact
                  label="Status"
                  value={
                    <StatusBadge
                      label={JOB_STATUS_LABELS[data.status] ?? data.status}
                      tone={JOB_STATUS_TONES[data.status] ?? "neutral"}
                    />
                  }
                />
                <SideFact
                  label="Published"
                  value={formatDate(data.publishedAt)}
                />
                <SideFact label="Expires" value={formatDate(data.expiresAt)} />
                <SideFact
                  label="Visible on live map"
                  value={data.status === "published" ? "Yes" : "No"}
                />
              </dl>
            </SideSection>

            <SideSection title="Company">
              <Link
                href={companyHref}
                className="text-sub font-medium text-blue-ink hover:underline"
              >
                {data.company.companyName}
              </Link>
              <p className="mb-0 mt-1 text-meta leading-[18px] text-ink-muted">
                {[
                  data.company.contactName,
                  titleCaseWords(data.company.verificationStatus),
                  `Wallet ${formatMinor(data.company.walletBalanceMinor)}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </SideSection>

            {data.comingUp.length > 0 && (
              <SideSection title="Coming Up">
                <div className="-mt-2.5">
                  {data.comingUp.map((item) => (
                    <ComingUpRow key={item.id} item={item} />
                  ))}
                </div>
              </SideSection>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
