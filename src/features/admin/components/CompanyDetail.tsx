"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, BadgeCheck, BadgeX } from "lucide-react";

import { CompanyLogo } from "@/shared/ui-components/data/CompanyLogo";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { cn } from "@/shared/libs/shadCnConfig";
import { useCanonicalPath } from "@/shared/hooks/useCanonicalPath";
import { adminCompanyPath, urlRef } from "@/shared/utils/entityPaths";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";
import { Textarea } from "@/shared/ui-components/controls/textarea";
import {
  useAdminCompany,
  useDecideCompanyVerification,
} from "../hooks/useAdmin";
import type { CompanyDetail as CompanyDetailData } from "../schemas";
import { VERIFICATION_LABELS } from "../schemas";
import { HoldButton } from "./HoldButton";
import {
  DetailField,
  DetailSkeleton,
  FACTS_GRID,
  FACT_FULL,
} from "./DetailPrimitives";
import {
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_STATUS_TONES,
  VERIFICATION_STATUS_TONES,
} from "./statusStyles";

/**
 * The admin's approval decision. The note reaches the company either way — it
 * becomes the decline's notification body, and is appended to the approval's —
 * so it is worth writing well.
 */
function VerificationCard({ data }: { data: CompanyDetailData }) {
  const decide = useDecideCompanyVerification();
  const [note, setNote] = useState("");

  const submit = (status: "verified" | "rejected"): void => {
    decide.mutate(
      { userId: data.userId, status, note: note.trim() || undefined },
      { onSuccess: () => setNote("") },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approval</CardTitle>
        <StatusBadge
          className="ml-auto"
          label={VERIFICATION_LABELS[data.verificationStatus]}
          tone={VERIFICATION_STATUS_TONES[data.verificationStatus] ?? "neutral"}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        <p className="text-sub text-ink-muted">
          {data.verificationStatus === "verified"
            ? "This company can post jobs and review candidate submissions."
            : data.verificationStatus === "rejected"
              ? "This company was declined. Approving now restores full access."
              : "Review the profile, then approve or decline. A pending company cannot post jobs or review candidates, and is hidden from recruiters."}
        </p>
        {data.verificationNote && (
          /* `.well` — the previous decision, kept as context beside the new one. */
          <p className="rounded-sm border border-line bg-surface-sub px-3 py-2.5 text-body text-ink-body">
            <span className="font-[650] text-ink">Last note:</span>{" "}
            {data.verificationNote}
          </p>
        )}
        <Textarea
          rows={2}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional note — sent to the company with the decision."
          aria-label="Approval note"
        />
      </CardContent>
      <CardFooter className="flex-wrap">
        {data.verificationStatus !== "verified" && (
          <Button
            type="button"
            disabled={decide.isPending}
            onClick={() => submit("verified")}
          >
            <BadgeCheck />
            Approve
          </Button>
        )}
        {data.verificationStatus !== "rejected" && (
          <Button
            type="button"
            variant="destructive"
            disabled={decide.isPending}
            onClick={() => submit("rejected")}
          >
            <BadgeX />
            Decline
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

/** Label + clickable count that deep-links to this company's jobs list. */
function JobCountField({
  label,
  count,
  href,
}: {
  label: string;
  count: number;
  href: string;
}) {
  return (
    <div>
      <div className="text-label font-[650] uppercase text-ink-muted">
        {label}
      </div>
      <div className="mt-[3px] text-body font-[550] tabular-nums text-ink">
        {count > 0 ? (
          <Link
            href={href}
            className="text-blue-ink hover:underline focus-visible:underline focus-visible:outline-none"
          >
            {count}
          </Link>
        ) : (
          0
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Prefix "$" and group a plain revenue figure ("3500000" → "$3,500,000"). A
 * non-numeric legacy value is shown as-is behind the "$". */
function formatRevenue(revenue: string): string {
  const digits = revenue.replace(/[^\d.]/g, "");
  const n = Number(digits);
  return digits !== "" && Number.isFinite(n)
    ? `$${n.toLocaleString("en-US")}`
    : `$${revenue}`;
}

/** One cell of the wallet strip — the reference's `.stat` figure, ruled off
 * from its neighbour rather than boxed on its own. */
function WalletStat({
  label,
  minor,
  first = false,
}: {
  label: string;
  minor: number;
  /** The leading cell owns no divider. */
  first?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex-1 px-4 py-3.5",
        first ? "" : "border-t border-line sm:border-l sm:border-t-0",
      )}
    >
      <p className="text-label font-[650] uppercase text-ink-muted">{label}</p>
      <p className="mt-[5px] text-stat font-bold tabular-nums text-ink">
        {formatMinor(minor)}
      </p>
    </div>
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
  const location = [cityState, data.zip].filter(Boolean).join(" ") || "—";
  const revenue =
    data.revenue === null || data.revenue.trim() === ""
      ? null
      : formatRevenue(data.revenue);
  const jobsHref = `/admin/jobs?${new URLSearchParams({
    company: urlRef({
      id: data.companyProfileId,
      serialNumber: data.companySerialNumber,
    }),
    companyName: data.companyName,
  }).toString()}`;

  // Smallest to largest recruiter fee this company has actually posted, not the
  // range it advertises on its profile — a company that posted $500 and $2,000
  // reads "$500 – $2,000" here however it filled its profile in. Collapses to a
  // single figure when every job carries the same fee.
  const { minFeeMinor: min, maxFeeMinor: max } = data;
  const feeRange =
    min === null || max === null
      ? null
      : min === max
        ? formatMinor(min)
        : `${formatMinor(min)} – ${formatMinor(max)}`;

  return (
    <div className="flex w-full max-w-5xl flex-col gap-3">
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <CompanyLogo
              companyProfileId={data.companyProfileId}
              hasLogo={data.hasLogo}
              name={data.companyName}
              size="lg"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-page font-bold text-ink">
                  {data.companyName}
                </h2>
                <StatusBadge
                  label={ACCOUNT_STATUS_LABELS[data.status]}
                  tone={ACCOUNT_STATUS_TONES[data.status]}
                />
                <StatusBadge
                  label={VERIFICATION_LABELS[data.verificationStatus]}
                  tone={
                    VERIFICATION_STATUS_TONES[data.verificationStatus] ??
                    "neutral"
                  }
                />
              </div>
              <p className="mt-0.5 text-sub text-ink-muted">{data.email}</p>
            </div>
          </div>
          <div className="sm:ml-auto sm:shrink-0">
            <HoldButton
              userId={data.userId}
              status={data.status}
              subjectName={data.companyName}
            />
          </div>
        </CardContent>
      </Card>

      <VerificationCard data={data} />

      <Card>
        <div className="flex flex-col sm:flex-row">
          <WalletStat label="Available" minor={data.availableMinor} first />
          <WalletStat label="Balance" minor={data.balanceMinor} />
          <WalletStat label="Reserved" minor={data.reservedMinor} />
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className={FACTS_GRID}>
            <DetailField label="First name" value={data.firstName} />
            <DetailField label="Last name" value={data.lastName} />
            <DetailField label="Phone" value={data.phone} />
            <DetailField
              label="Phone confirmed"
              value={data.phoneVerified ? "Yes" : "No"}
            />
            <DetailField label="Email" value={data.email} />
            <DetailField
              label="Email confirmed"
              value={data.emailVerified ? "Yes" : "No"}
            />
            <DetailField label="Address" value={data.addressLine} />
            <DetailField label="Location" value={location} />
            {/* Full width, so the website reads directly under the address it
                belongs with rather than sharing a row with the joined date. */}
            <div className={FACT_FULL}>
              <DetailField label="Website" value={data.website} />
            </div>
            <div className={FACT_FULL}>
              <DetailField label="Joined" value={formatDate(data.joinedAt)} />
            </div>
            <div className={FACT_FULL}>
              <DetailField label="Description" value={data.description} />
            </div>
          </CardContent>
        </Card>

        {/* The sign-up questionnaire. This is what an admin actually reads to
            judge whether a company is real, so it gets its own card rather
            than being buried among the contact fields. */}
        <Card>
          <CardHeader>
            <CardTitle>Business Profile</CardTitle>
          </CardHeader>
          <CardContent className={FACTS_GRID}>
            <DetailField label="Industry" value={data.industry} />
            <DetailField
              label="Founded"
              value={
                data.yearFounded !== null ? String(data.yearFounded) : null
              }
            />
            <DetailField label="Employees" value={data.employeeSize} />
            <DetailField label="Revenue" value={revenue} />
            <div className={FACT_FULL}>
              <DetailField label="Fee range" value={feeRange} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent className={FACTS_GRID}>
            <JobCountField
              label="Jobs posted"
              count={data.jobCount}
              href={jobsHref}
            />
            <JobCountField
              label="Open jobs"
              count={data.openJobCount}
              href={`${jobsHref}&status=published`}
            />
            <DetailField
              label="Last login"
              value={formatDate(data.lastLoginAt)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
