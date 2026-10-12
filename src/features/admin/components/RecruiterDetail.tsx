"use client";

import Link from "next/link";
import { AlertCircle, ChevronRight } from "lucide-react";

import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";

import { useCanonicalPath } from "@/shared/hooks/useCanonicalPath";

import { adminRecruiterPath } from "@/shared/utils/entityPaths";

import { formatMinor } from "@/shared/utils/money";

import { getSpecializationLabel } from "@/shared/utils/specializations";

import { Button } from "@/shared/ui-components/controls/button";

import { useAdminRecruiter } from "../hooks/useAdmin";

import {
  SUBSCRIPTION_LABELS,
  VERIFICATION_LABELS,
  type RecruiterLifecycle,
  type RecruiterPayoutAccount,
} from "../schemas";

import { RecruiterAccountActions } from "./RecruiterAccountActions";

import {
  DetailSkeleton,
  SideFact,
  SideSection,
  initials,
} from "./DetailPrimitives";

import { RecruiterSubmissions } from "./RecruiterSubmissions";

import {
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_STATUS_TONES,
  VERIFICATION_STATUS_TONES,
} from "./statusStyles";

import { cn } from "@/shared/libs/shadCnConfig";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** "Mar 2025" — the granularity a "member since" line wants. */
function monthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function lastActiveLabel(iso: string | null): string | null {
  if (!iso) return null;
  const at = new Date(iso);
  if (at.toDateString() === new Date().toDateString()) {
    return "Last active today";
  }
  return `Last active ${formatDate(iso)}`;
}

/** "under_review" → "Under Review", for the enums the design prints raw. */
function titleCaseWords(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function payoutLabel(account: RecruiterPayoutAccount): string {
  const bank = [
    account.bankName,
    account.bankLast4 && `•••• ${account.bankLast4}`,
  ]
    .filter(Boolean)
    .join(" ");
  return bank ? `Connected account · ${bank}` : "Connected account";
}

/**
 * The placement funnel: five steps left to right, each a count with the fact
 * that qualifies it. A step still holding money is drawn hollow in amber —
 * the whole point of the strip is to show where the pipeline has stalled, and
 * a row of identical blue dots would hide exactly that.
 */
function LifecycleStrip({ lifecycle }: { lifecycle: RecruiterLifecycle }) {
  const yetToJoin = Math.max(lifecycle.offersAccepted - lifecycle.joined, 0);
  const steps = [
    {
      n: lifecycle.offersAccepted,
      label: "offers accepted",
      note: yetToJoin > 0 ? `${yetToJoin} yet to join` : "All joined",
      held: false,
    },
    {
      n: lifecycle.joined,
      label: "joined",
      note: "Dates confirmed",
      held: false,
    },
    {
      n: lifecycle.inGuarantee,
      label: "in guarantee",
      note:
        lifecycle.disputed > 0
          ? `${lifecycle.disputed} disputed, payout held`
          : "No holds",
      held: lifecycle.inGuarantee > 0,
    },
    {
      n: lifecycle.completed,
      label: "completed",
      note: "Guarantee served",
      held: false,
    },
    { n: lifecycle.paid, label: "paid", note: "All settled", held: false },
  ];

  return (
    <div className="px-7 pb-5 pt-4 shadow-[inset_0_1px_0_theme(colors.tint.strong)]">
      <ol
        aria-label="Placement lifecycle"
        className="relative m-0 grid list-none grid-cols-2 gap-y-4 p-0 sm:grid-cols-3 lg:grid-cols-5 lg:gap-y-0"
      >
        {steps.map((step, index) => (
          <li key={step.label} className="relative flex flex-col gap-0.5 pr-3">
            {/* The connector runs from this dot to the next one, so the last
                step does not trail a line into empty space. */}
            {index < steps.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute left-3.5 right-0 top-[6px] hidden h-0.5 bg-tint-strong lg:block"
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                "relative z-[1] mb-2 size-3.5 rounded-full border-2 ring-[3px] ring-canvas",
                step.held
                  ? "border-warn-dot bg-surface"
                  : "border-blue bg-blue",
                index === steps.length - 1 &&
                  !step.held &&
                  "border-ok-dot bg-ok-dot",
              )}
            />
            <span className="text-sub text-ink">
              <span className="font-[650] tabular-nums">{step.n}</span>{" "}
              {step.label}
            </span>
            <span
              className={cn(
                "text-meta",
                step.held ? "text-warn" : "text-ink-muted",
              )}
            >
              {step.note}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function RecruiterDetail({ recruiterRef }: { recruiterRef: string }) {
  const { data, isPending, isError, refetch } = useAdminRecruiter(recruiterRef);
  useCanonicalPath(
    data &&
      adminRecruiterPath({
        id: data.userId,
        serialNumber: data.recruiterSerialNumber,
      }),
  );

  if (isPending) return <DetailSkeleton />;
  if (isError) {
    return (
      <div className="flex max-w-md flex-col gap-3 rounded-sm border border-bad-line bg-bad-bg p-3.5 text-sub text-bad">
        <div className="flex items-center gap-2.5 font-[550]">
          <AlertCircle className="size-[15px] shrink-0" />
          Could not load this recruiter.
        </div>
        <div>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const name = `${data.firstName} ${data.lastName}`;
  const cityState = [data.city, data.state].filter(Boolean).join(", ");
  const location = [cityState, data.zip].filter(Boolean).join(" ") || "—";
  const metaLine = [
    cityState || null,
    `Member since ${monthYear(data.joinedAt)}`,
    lastActiveLabel(data.lastLoginAt),
  ]
    .filter(Boolean)
    .join(" · ");

  // The four figures the design leads the profile with. `accent` marks the
  // one the page is really about — what this recruiter has earned.
  const performance = [
    {
      label: "Rating",
      value: data.ratingAvg === null ? "Unrated" : data.ratingAvg.toFixed(1),
      note:
        data.ratingCount > 0
          ? `From ${data.ratingCount} company review${data.ratingCount === 1 ? "" : "s"}`
          : "No reviews yet",
      accent: false,
    },
    {
      label: "Successful placements",
      value: data.placementCount.toLocaleString(),
      note: "Guarantee completed",
      accent: false,
    },
    {
      label: "Candidates submitted",
      value: data.candidateCount.toLocaleString(),
      note: "Across every job",
      accent: false,
    },
    {
      label: "Total earned",
      value: formatMinor(data.releasedEarningsMinor),
      note: "Released to this recruiter",
      accent: true,
    },
  ];

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-tint text-block font-[650] text-blue-ink"
          >
            {initials(data.firstName, data.lastName)}
          </span>
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-page font-bold text-ink">{name}</h1>
              <StatusBadge
                label={VERIFICATION_LABELS[data.verificationStatus]}
                tone={
                  VERIFICATION_STATUS_TONES[data.verificationStatus] ??
                  "neutral"
                }
              />
              <StatusBadge
                label={ACCOUNT_STATUS_LABELS[data.status]}
                tone={ACCOUNT_STATUS_TONES[data.status]}
              />
            </div>
            <p className="text-sub text-ink-muted">{metaLine}</p>
          </div>
        </div>
        <RecruiterAccountActions data={data} presentation="menu" />
      </header>

      {/* The design leads with a tinted band rather than four white cards:
          these figures qualify everything below them, so they read as one
          statement about the recruiter instead of four competing tiles. */}
      <section
        aria-label="Performance summary"
        className="rounded-lg bg-tint/55 shadow-[0_0_0_1px_theme(colors.tint.strong)]"
      >
        <dl className="m-0 grid py-5 [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]">
          {performance.map((item) => (
            <div
              key={item.label}
              className="flex flex-col gap-1 px-7 shadow-[inset_-1px_0_0_theme(colors.tint.strong)] last:shadow-none"
            >
              <dt className="text-meta font-medium text-ink-muted">
                {item.label}
              </dt>
              <dd
                className={cn(
                  "m-0 text-[26px] font-semibold leading-8 tracking-[-0.02em] tabular-nums",
                  item.accent ? "text-blue-ink" : "text-ink",
                )}
              >
                {item.value}
              </dd>
              <dd className="m-0 text-meta text-ink-muted">{item.note}</dd>
            </div>
          ))}
        </dl>
        <LifecycleStrip lifecycle={data.lifecycle} />
      </section>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[3_1_600px] flex-col gap-4">
          <RecruiterSubmissions recruiterProfileId={data.recruiterProfileId} />
        </div>

        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <div className="rounded-md bg-surface shadow-e1">
            <SideSection title="Account">
              <dl className="m-0 flex flex-col gap-2.5">
                <SideFact
                  label="Verification"
                  value={
                    data.verifiedAt
                      ? `Verified ${formatDate(data.verifiedAt)}`
                      : VERIFICATION_LABELS[data.verificationStatus]
                  }
                />
                <SideFact
                  label="Subscription"
                  value={
                    <>
                      {SUBSCRIPTION_LABELS[data.subscriptionStatus] ??
                        data.subscriptionStatus}
                      {data.currentPeriodEnd && (
                        <span className="text-ink-muted">
                          {" · renews "}
                          {formatDate(data.currentPeriodEnd)}
                        </span>
                      )}
                    </>
                  }
                />
                {data.recruiterSerialNumber && (
                  <SideFact
                    label="Recruiter ID"
                    value={
                      <span className="tabular-nums text-ink-body">
                        {data.recruiterSerialNumber}
                      </span>
                    }
                  />
                )}
                <SideFact label="Joined" value={formatDate(data.joinedAt)} />
                <SideFact
                  label="Last login"
                  value={formatDate(data.lastLoginAt)}
                />
              </dl>
              {/* Folded away because an admin opens this page to read it far
                  more often than to act on it — and every action below is
                  one that signs somebody out or cuts off their access. */}
              <details className="mt-3.5">
                <summary className="cursor-pointer list-none text-sub font-medium text-blue-ink [&::-webkit-details-marker]:hidden">
                  Account actions
                </summary>
                <RecruiterAccountActions data={data} presentation="stack" />
              </details>
            </SideSection>

            <SideSection title="Contact">
              <dl className="m-0 flex flex-col gap-2.5 text-sub">
                <div>
                  <dt className="sr-only">Email</dt>
                  <dd className="m-0 break-words text-ink">
                    {data.email}
                    {data.emailVerified && (
                      <span className="text-meta text-ok"> · verified</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="sr-only">Phone</dt>
                  <dd className="m-0 text-ink">
                    {data.phone || "—"}
                    {data.phone && data.phoneVerified && (
                      <span className="text-meta text-ok"> · confirmed</span>
                    )}
                  </dd>
                </div>
                {data.linkedinUrl && (
                  <div>
                    <dt className="sr-only">LinkedIn</dt>
                    <dd className="m-0">
                      <a
                        href={data.linkedinUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="break-all text-blue-ink hover:underline"
                      >
                        {data.linkedinUrl.replace(/^https?:\/\//, "")}
                      </a>
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="sr-only">Address</dt>
                  <dd className="m-0 text-ink-muted">
                    {[data.addressLine, location].filter(Boolean).join(" · ")}
                  </dd>
                </div>
              </dl>
            </SideSection>

            <SideSection title="Recruiting Experience">
              <p className="m-0 text-sub text-ink">
                {data.yearsExperience !== null ? (
                  <strong className="font-[650]">
                    {data.yearsExperience} year
                    {data.yearsExperience === 1 ? "" : "s"}
                  </strong>
                ) : (
                  <span className="text-ink-muted">Not stated</span>
                )}
                {data.specializations && data.specializations.length > 0 && (
                  <>
                    {" · "}
                    {data.specializations
                      .map(getSpecializationLabel)
                      .join(", ")}
                  </>
                )}
              </p>
              {data.experiences.length > 0 && (
                /* The design prints the firms as one line. Each entry also
                   carries its own tenure and specialisms, which an admin
                   weighing a verification needs, so the firms keep the same
                   well the references below them use rather than collapsing
                   to a comma list that drops both. */
                <div className="mt-3 rounded-sm bg-surface-sub px-3">
                  {data.experiences.map((experience, index) => (
                    <div
                      key={experience.id}
                      className={cn(
                        "py-2.5 text-sub",
                        index < data.experiences.length - 1 &&
                          "border-b border-line",
                      )}
                    >
                      <span className="flex flex-wrap items-baseline gap-2">
                        <span className="font-medium text-ink">
                          {experience.firmName}
                        </span>
                        {experience.years !== null && (
                          <span className="text-meta tabular-nums text-ink-muted">
                            {experience.years} yr
                            {experience.years === 1 ? "" : "s"}
                          </span>
                        )}
                      </span>
                      {experience.specializations.length > 0 && (
                        <span className="mt-0.5 block text-meta text-ink-muted">
                          {experience.specializations
                            .map(getSpecializationLabel)
                            .join(" · ")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {data.references.length > 0 && (
                /* The design holds references in a well rather than a list of
                   rows on the card: they are supporting evidence for the line
                   above, not a section of their own. */
                <div className="mt-3.5 rounded-sm bg-surface-sub px-3">
                  {data.references.map((ref, index) => (
                    <div
                      key={ref.id}
                      className={cn(
                        "flex items-center justify-between gap-2.5 py-2.5 text-sub",
                        index < data.references.length - 1 &&
                          "border-b border-line",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="font-medium text-ink">{ref.name}</span>
                        {ref.company && (
                          <span className="block truncate text-meta text-ink-muted">
                            {ref.company}
                          </span>
                        )}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 whitespace-nowrap text-meta font-medium",
                          ref.verified ? "text-ok" : "text-ink-muted",
                        )}
                      >
                        {ref.verified ? "Verified" : "Not contacted"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </SideSection>
          </div>

          {data.payoutAccount && (
            <section className="rounded-lg bg-ok-bg/60 px-5 py-4 shadow-[0_0_0_1px_theme(colors.ok.line)]">
              <h2 className="mb-2 text-label font-[650] uppercase tracking-[0.06em] text-ok">
                Payout Destination
              </h2>
              <div className="flex items-center justify-between gap-3 text-sub">
                <span className="min-w-0 text-ink">
                  {payoutLabel(data.payoutAccount)}
                </span>
                <span
                  className={cn(
                    "shrink-0 font-medium",
                    data.payoutAccount.status === "enabled"
                      ? "text-ok"
                      : "text-warn",
                  )}
                >
                  {titleCaseWords(data.payoutAccount.status)}
                </span>
              </div>
              {data.payoutAccount.disabledReason && (
                <p className="mb-0 mt-1.5 text-meta text-ink-muted">
                  {data.payoutAccount.disabledReason}
                </p>
              )}
            </section>
          )}

          {data.openDisputes.map((dispute) => (
            <Link
              key={dispute.id}
              href={`/admin/disputes/${dispute.serialNumber}`}
              className="block rounded-lg bg-warn-bg/50 px-5 py-4 text-ink shadow-[0_0_0_1px_theme(colors.warn.line)] transition-colors hover:bg-warn-bg/80"
            >
              <span className="mb-2 block text-label font-[650] uppercase tracking-[0.06em] text-warn">
                Open Dispute
              </span>
              <span className="flex items-center justify-between gap-2.5 text-sub">
                <span className="min-w-0">
                  <span className="font-medium">
                    DSP-{dispute.serialNumber} ·{" "}
                    {titleCaseWords(dispute.subject)}
                  </span>
                  <span className="block text-meta text-ink-muted">
                    {dispute.companyName} · {formatMinor(dispute.amountMinor)}{" "}
                    held
                  </span>
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-ink-faint"
                  aria-hidden="true"
                />
              </span>
            </Link>
          ))}
        </aside>
      </div>
    </div>
  );
}
