"use client";

import Link from "next/link";
import { ChevronRight, AlertCircle } from "lucide-react";

import { CompanyLogo } from "@/shared/ui-components/data/CompanyLogo";

import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";

import { cn } from "@/shared/libs/shadCnConfig";

import { useCanonicalPath } from "@/shared/hooks/useCanonicalPath";

import { adminCompanyPath, jobPath, urlRef } from "@/shared/utils/entityPaths";

import { formatMinor } from "@/shared/utils/money";

import { Button } from "@/shared/ui-components/controls/button";

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

import { useAdminCompany, useAdminJobs } from "../hooks/useAdmin";

import {
  JOB_STATUS_LABELS,
  VERIFICATION_LABELS,
  type CompanyDetail as CompanyDetailData,
  type CompanyLedgerRow,
} from "../schemas";

import { CompanyAccountActions } from "./CompanyAccountActions";

import { DetailSkeleton, SideFact, SideSection } from "./DetailPrimitives";

import {
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_STATUS_TONES,
  JOB_STATUS_TONES,
  VERIFICATION_STATUS_TONES,
} from "./statusStyles";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "Feb 2026" — the granularity a "member since" line wants. */
function monthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

/** The revenue answer is free text on the sign-up form, so it may be a bare
 *  number, a band, or already formatted. */
function formatRevenue(revenue: string): string {
  const digits = revenue.replace(/[^\d.]/g, "");
  const n = Number(digits);
  return digits !== "" && Number.isFinite(n)
    ? `$${n.toLocaleString("en-US")}`
    : `$${revenue}`;
}

/**
 * The wording for each kind of wallet movement. The API sends the raw entry
 * type; the labels live here, because how an admin reads "reserve" changes far
 * more often than the ledger does.
 */
const LEDGER_LABELS = new Map<string, string>([
  ["credit", "Deposit"],
  ["debit", "Charge"],
  ["reserve", "Fee reserved"],
  ["release_reserve", "Reservation released"],
  ["hold", "Fee held"],
  ["release_hold", "Hold released"],
  ["refund", "Refund"],
  ["payout", "Fee settled"],
]);

const LEDGER_REF_LABELS = new Map<string, string>([
  ["topup", "Wallet top-up"],
  ["job", "Job"],
  ["placement", "Placement"],
  ["dispute", "Dispute"],
  ["payout", "Payout"],
  ["subscription", "Subscription"],
]);

/** Money leaving the wallet reads as a negative; everything else is a credit
 *  or a ring-fence that has not left yet. */
const OUTGOING = new Set(["debit", "payout"]);

function LedgerAmount({ row }: { row: CompanyLedgerRow }) {
  const outgoing = OUTGOING.has(row.entryType);
  const incoming = row.entryType === "credit" || row.entryType === "refund";
  return (
    <span
      className={cn(
        "whitespace-nowrap font-medium tabular-nums",
        outgoing ? "text-bad" : incoming ? "text-ok" : "text-ink",
      )}
    >
      {outgoing ? "−" : incoming ? "+" : ""}
      {formatMinor(row.amountMinor)}
    </span>
  );
}

export function CompanyDetail({ companyRef }: { companyRef: string }) {
  const { data, isPending, isError, refetch } = useAdminCompany(companyRef);
  useCanonicalPath(
    data &&
      adminCompanyPath({
        id: data.userId,
        serialNumber: data.companySerialNumber,
      }),
  );
  // The profile previews the company's newest jobs; the full board is a click
  // away, so this asks for one short page rather than paging here.
  const jobs = useAdminJobs({
    page: 1,
    limit: 5,
    company: data
      ? urlRef({
          id: data.companyProfileId,
          serialNumber: data.companySerialNumber,
        })
      : undefined,
  });

  if (isPending) return <DetailSkeleton />;
  if (isError) {
    return (
      <div className="flex max-w-md flex-col gap-3 rounded-sm border border-bad-line bg-bad-bg p-3.5 text-sub text-bad">
        <div className="flex items-center gap-2.5 font-[550]">
          <AlertCircle className="size-[15px] shrink-0" />
          Could not load this company.
        </div>
        <div>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const cityState = [data.city, data.state].filter(Boolean).join(", ");
  const address =
    [data.addressLine, cityState, data.zip].filter(Boolean).join(", ") || "—";
  const revenue =
    data.revenue === null || data.revenue.trim() === ""
      ? null
      : formatRevenue(data.revenue);
  const companyParam = urlRef({
    id: data.companyProfileId,
    serialNumber: data.companySerialNumber,
  });
  const jobsHref = `/admin/jobs?${new URLSearchParams({
    company: companyParam,
    companyName: data.companyName,
  }).toString()}`;

  // Smallest to largest recruiter fee this company has actually posted, not the
  // range it advertises on its profile. Collapses to a single figure when every
  // job carries the same fee.
  const { minFeeMinor: min, maxFeeMinor: max } = data;
  const feeRange =
    min === null || max === null
      ? "No jobs posted yet"
      : min === max
        ? `Every job at ${formatMinor(min)}`
        : `Range ${formatMinor(min)} – ${formatMinor(max)}`;

  const summary = [
    {
      label: "Wallet balance",
      value: formatMinor(data.balanceMinor),
      note: `${formatMinor(data.availableMinor)} available · ${formatMinor(data.reservedMinor)} reserved`,
    },
    {
      label: "Open jobs",
      value: data.openJobCount.toLocaleString(),
      note: `${data.jobCount.toLocaleString()} posted in total`,
    },
    {
      label: "Placements",
      value: data.placementCount.toLocaleString(),
      note: `From ${data.offerCount.toLocaleString()} offer${data.offerCount === 1 ? "" : "s"}`,
    },
    {
      label: "Average fee",
      value: data.avgFeeMinor === null ? "—" : formatMinor(data.avgFeeMinor),
      note: feeRange,
    },
  ];

  // Reserved is a share of the balance, so the bar is two parts of one whole.
  const reservedShare =
    data.balanceMinor > 0
      ? Math.min(
          100,
          Math.round((data.reservedMinor / data.balanceMinor) * 100),
        )
      : 0;

  // Both carry the company, so each lands on a list already narrowed to it
  // rather than the whole board with the reader left to filter it again.
  const companyScope = new URLSearchParams({
    companyProfileId: data.companyProfileId,
    companyName: data.companyName,
  }).toString();
  const related = [
    {
      label: "Candidate submissions",
      href: `/admin/conversations?${companyScope}`,
    },
    { label: "Disputes", href: `/admin/disputes?${companyScope}` },
  ];

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <CompanyLogo
            companyProfileId={data.companyProfileId}
            hasLogo={data.hasLogo}
            name={data.companyName}
            size="lg"
          />
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-page font-bold text-ink">{data.companyName}</h1>
            {/* The design states these as a dotted line rather than chips —
                four facts read as one sentence, where four pills would read as
                four competing badges. */}
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-sub text-ink-muted">
              <span className="inline-flex items-center gap-1.5 text-ok">
                <span
                  aria-hidden="true"
                  className={cn("size-1.5 rounded-full", TONE_DOT.ok)}
                />
                {VERIFICATION_LABELS[data.verificationStatus]}
              </span>
              <span className="inline-flex items-center gap-1.5 text-ink-body">
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-1.5 rounded-full",
                    TONE_DOT[ACCOUNT_STATUS_TONES[data.status]],
                  )}
                />
                {ACCOUNT_STATUS_LABELS[data.status]}
              </span>
              {data.industry && <span>{data.industry}</span>}
              {cityState && <span>{cityState}</span>}
            </div>
          </div>
        </div>
        <CompanyAccountActions data={data} presentation="menu" />
      </header>

      <section
        aria-label="Company summary"
        className="overflow-hidden rounded-lg bg-surface shadow-e1"
      >
        <dl className="m-0 grid [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
          {summary.map((item) => (
            <div
              key={item.label}
              className="flex flex-col gap-1 px-6 py-4.5 shadow-[inset_-1px_0_0_theme(colors.line.DEFAULT)] last:shadow-none"
            >
              <dt className="text-meta font-medium text-ink-muted">
                {item.label}
              </dt>
              <dd className="m-0 text-[26px] font-semibold leading-8 tracking-[-0.02em] tabular-nums text-ink">
                {item.value}
              </dd>
              <dd className="m-0 text-meta leading-[18px] text-ink-muted">
                {item.note}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[3_1_600px] flex-col gap-6">
          <section className="overflow-hidden rounded-md bg-surface shadow-e1">
            <div className="flex items-center justify-between gap-3 px-6 py-4">
              <h2 className="text-card font-[650] text-ink">Jobs</h2>
              <Link
                href={jobsHref}
                className="text-sub font-medium text-blue-ink hover:underline"
              >
                View all
              </Link>
            </div>
            {jobs.isPending ? (
              <div className="flex flex-col">
                {[0, 1, 2].map((row) => (
                  <div
                    key={row}
                    className="flex h-14 items-center gap-4 border-t border-line px-6"
                  >
                    <div className="h-3.5 w-1/3 animate-pulse rounded-xs bg-surface-sunken" />
                    <div className="ml-auto h-5.25 w-20 animate-pulse rounded-full bg-surface-sunken" />
                  </div>
                ))}
              </div>
            ) : jobs.isError ? (
              <p className="px-6 pb-6 text-sub text-ink-muted">
                Could not load this company&rsquo;s jobs.
              </p>
            ) : jobs.data.data.length === 0 ? (
              <p className="px-6 pb-6 text-sub text-ink-muted">
                This company has not posted a job yet.
              </p>
            ) : (
              <div className={TABLE_SCROLL}>
                <table className={TABLE_EL}>
                  <thead className={TABLE_HEAD}>
                    <tr>
                      <th scope="col" className={TABLE_TH}>
                        Job
                      </th>
                      <th scope="col" className={TABLE_TH}>
                        Status
                      </th>
                      <th scope="col" className={cn(TABLE_TH, "text-right")}>
                        Candidates
                      </th>
                      <th scope="col" className={cn(TABLE_TH, "text-right")}>
                        Recruiter Fee
                      </th>
                    </tr>
                  </thead>
                  <tbody className={TABLE_BODY}>
                    {jobs.data.data.map((job) => (
                      <tr key={job.jobId} className={TABLE_ROW}>
                        <td className={TABLE_TD_STACKED}>
                          <Link
                            href={jobPath({
                              id: job.jobId,
                              serialNumber: job.jobSerialNumber,
                            })}
                            className={cn(
                              TABLE_CELL_MAIN,
                              "block transition-colors hover:text-blue focus-visible:underline focus-visible:outline-none",
                            )}
                          >
                            {job.title}
                          </Link>
                          <span className={TABLE_CELL_SUB}>
                            Posted {formatDate(job.createdAt)}
                          </span>
                        </td>
                        <td className={TABLE_TD}>
                          <StatusBadge
                            label={JOB_STATUS_LABELS[job.status] ?? job.status}
                            tone={JOB_STATUS_TONES[job.status] ?? "neutral"}
                          />
                        </td>
                        <td className={cn(TABLE_TD, "text-right")}>
                          {job.candidateCount > 0 ? (
                            <Link
                              href={`/admin/submissions?${new URLSearchParams({ jobId: job.jobId }).toString()}`}
                              className="font-[550] tabular-nums text-blue-ink hover:underline focus-visible:underline focus-visible:outline-none"
                            >
                              {job.candidateCount}
                            </Link>
                          ) : (
                            <span className="tabular-nums text-ink-faint">
                              0
                            </span>
                          )}
                        </td>
                        <td
                          className={cn(
                            TABLE_TD,
                            "whitespace-nowrap text-right font-medium tabular-nums text-ink",
                          )}
                        >
                          {formatMinor(job.recruiterFeeMinor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-md bg-surface shadow-e1">
            <div className="flex items-center justify-between gap-3 px-6 py-4">
              <h2 className="text-card font-[650] text-ink">Wallet</h2>
            </div>
            <div className="flex flex-col gap-3 px-6 pb-4">
              <div
                role="img"
                aria-label={`Wallet: ${formatMinor(data.availableMinor)} available, ${formatMinor(data.reservedMinor)} reserved`}
                className="flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-line"
              >
                <div
                  className="bg-blue"
                  style={{ width: `${100 - reservedShare}%` }}
                />
                <div
                  className="bg-warn-dot"
                  style={{ width: `${reservedShare}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-sub text-ink-body">
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-xs bg-blue"
                  />
                  Available · can fund new jobs
                </span>
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-xs bg-warn-dot"
                  />
                  Reserved · held for live jobs and placements
                </span>
              </div>
            </div>
            {data.recentLedger.length === 0 ? (
              <p className="px-6 pb-6 text-sub text-ink-muted">
                No wallet activity yet.
              </p>
            ) : (
              <div className={TABLE_SCROLL}>
                <table className={TABLE_EL}>
                  <thead className={TABLE_HEAD}>
                    <tr>
                      <th scope="col" className={TABLE_TH}>
                        Date
                      </th>
                      <th scope="col" className={TABLE_TH}>
                        Activity
                      </th>
                      <th scope="col" className={cn(TABLE_TH, "text-right")}>
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className={TABLE_BODY}>
                    {data.recentLedger.map((row) => (
                      <tr key={row.id} className={TABLE_ROW}>
                        <td
                          className={cn(
                            TABLE_TD,
                            "whitespace-nowrap text-ink-muted",
                          )}
                        >
                          {formatDate(row.at)}
                        </td>
                        <td className={TABLE_TD_STACKED}>
                          <span className={cn(TABLE_CELL_MAIN, "block")}>
                            {LEDGER_LABELS.get(row.entryType) ?? row.entryType}
                          </span>
                          <span className={TABLE_CELL_SUB}>
                            {LEDGER_REF_LABELS.get(row.referenceType) ??
                              row.referenceType}
                          </span>
                        </td>
                        <td className={cn(TABLE_TD, "text-right")}>
                          <LedgerAmount row={row} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <div className="rounded-md bg-surface shadow-e1">
            <SideSection title="Account">
              <dl className="m-0 flex flex-col gap-2.5">
                <SideFact
                  label="Approval"
                  value={
                    <StatusBadge
                      label={VERIFICATION_LABELS[data.verificationStatus]}
                      tone={
                        VERIFICATION_STATUS_TONES[data.verificationStatus] ??
                        "neutral"
                      }
                    />
                  }
                />
                {data.verifiedAt && (
                  <SideFact
                    label="Approved"
                    value={formatDate(data.verifiedAt)}
                  />
                )}
                <SideFact
                  label="Account"
                  value={ACCOUNT_STATUS_LABELS[data.status]}
                />
                <SideFact
                  label="Member since"
                  value={monthYear(data.joinedAt)}
                />
                <SideFact
                  label="Last login"
                  value={formatDate(data.lastLoginAt)}
                />
              </dl>
              <details className="mt-3.5">
                <summary className="cursor-pointer list-none text-sub font-medium text-blue-ink [&::-webkit-details-marker]:hidden">
                  Account actions
                </summary>
                <CompanyAccountActions data={data} presentation="stack" />
              </details>
            </SideSection>

            <SideSection title="Company Profile">
              {data.description && (
                <p className="mb-3.5 mt-0 text-sub leading-5 text-ink-body">
                  {data.description}
                </p>
              )}
              <dl className="m-0 flex flex-col gap-2.5 text-sub">
                <div>
                  <dt className="text-meta text-ink-muted">Contact</dt>
                  <dd className="m-0 mt-0.5 text-ink">
                    {[data.firstName, data.lastName]
                      .filter(Boolean)
                      .join(" ") || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-meta text-ink-muted">Email</dt>
                  <dd className="m-0 mt-0.5 break-words text-ink">
                    {data.email}
                    {data.emailVerified && (
                      <span className="text-meta text-ok"> · verified</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-meta text-ink-muted">Phone</dt>
                  <dd className="m-0 mt-0.5 text-ink">
                    {data.phone || "—"}
                    {data.phone && data.phoneVerified && (
                      <span className="text-meta text-ok"> · confirmed</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-meta text-ink-muted">Address</dt>
                  <dd className="m-0 mt-0.5 text-ink">{address}</dd>
                </div>
                {data.website && (
                  <div>
                    <dt className="text-meta text-ink-muted">Website</dt>
                    <dd className="m-0 mt-0.5">
                      <a
                        href={data.website}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="break-all text-blue-ink hover:underline"
                      >
                        {data.website.replace(/^https?:\/\//, "")}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
              <details className="mt-3">
                <summary className="cursor-pointer list-none text-sub font-medium text-blue-ink [&::-webkit-details-marker]:hidden">
                  Business details
                </summary>
                <dl className="m-0 mt-2.5 flex flex-col gap-2.5 text-sub">
                  <div>
                    <dt className="text-meta text-ink-muted">Industry</dt>
                    <dd className="m-0 mt-0.5 text-ink">
                      {data.industry || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-meta text-ink-muted">Founded</dt>
                    <dd className="m-0 mt-0.5 tabular-nums text-ink">
                      {data.yearFounded ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-meta text-ink-muted">Employees</dt>
                    <dd className="m-0 mt-0.5 text-ink">
                      {data.employeeSize || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-meta text-ink-muted">Annual revenue</dt>
                    <dd className="m-0 mt-0.5 text-ink">{revenue || "—"}</dd>
                  </div>
                </dl>
              </details>
            </SideSection>

            <SideSection title="Related Records">
              <ul className="m-0 list-none p-0">
                {related.map((item, index) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex h-9.5 items-center justify-between gap-2 text-sub text-ink transition-colors hover:text-blue-ink",
                        index < related.length - 1 &&
                          "border-b border-line-row",
                      )}
                    >
                      <span>{item.label}</span>
                      <ChevronRight
                        className="size-4 shrink-0 text-ink-faint"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </SideSection>
          </div>
        </aside>
      </div>
    </div>
  );
}
