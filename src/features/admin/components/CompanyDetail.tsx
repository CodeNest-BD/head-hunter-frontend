"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, BadgeCheck, BadgeX } from "lucide-react";

import { CompanyLogo } from "@/shared/ui-components/data/CompanyLogo";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import {
  Card,
  CardContent,
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
import { DetailField, DetailSkeleton } from "./DetailPrimitives";
import {
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_STATUS_STYLES,
  VERIFICATION_STATUS_STYLES,
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
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Approval</CardTitle>
        <StatusBadge
          label={VERIFICATION_LABELS[data.verificationStatus]}
          className={
            VERIFICATION_STATUS_STYLES[data.verificationStatus] ??
            "bg-muted text-muted-foreground"
          }
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          {data.verificationStatus === "verified"
            ? "This company can post jobs and review candidate submissions."
            : data.verificationStatus === "rejected"
              ? "This company was declined. Approving now restores full access."
              : "Review the profile, then approve or decline. A pending company cannot post jobs or review candidates, and is hidden from recruiters."}
        </p>
        {data.verificationNote && (
          <p className="rounded-md border border-border bg-secondary/60 px-3 py-2 text-sm text-navy">
            <span className="font-semibold">Last note:</span>{" "}
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
        <div className="flex flex-wrap gap-2">
          {data.verificationStatus !== "verified" && (
            <Button
              type="button"
              disabled={decide.isPending}
              onClick={() => submit("verified")}
            >
              <BadgeCheck className="h-4 w-4" />
              Approve
            </Button>
          )}
          {data.verificationStatus !== "rejected" && (
            <Button
              type="button"
              variant="outline"
              disabled={decide.isPending}
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => submit("rejected")}
            >
              <BadgeX className="h-4 w-4" />
              Decline
            </Button>
          )}
        </div>
      </CardContent>
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
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
      {count > 0 ? (
        <Link
          href={href}
          className="w-fit text-sm font-semibold text-primary hover:underline focus-visible:underline focus-visible:outline-none"
        >
          {count}
        </Link>
      ) : (
        <span className="text-sm text-navy">0</span>
      )}
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

function WalletStat({
  label,
  minor,
  primary = false,
}: {
  label: string;
  minor: number;
  primary?: boolean;
}) {
  return (
    <div className="flex-1 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p
        className={
          "mt-1.5 font-heading font-extrabold leading-none " +
          (primary ? "text-3xl text-primary" : "text-2xl text-navy")
        }
      >
        {formatMinor(minor)}
      </p>
    </div>
  );
}

export function CompanyDetail({ userId }: { userId: string }) {
  const { data, isPending, isError, refetch } = useAdminCompany(userId);

  if (isPending) return <DetailSkeleton />;
  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-sm text-destructive">
          <AlertCircle className="h-6 w-6" />
          Could not load this company.
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const location = [data.city, data.state].filter(Boolean).join(", ") || "—";
  const jobsHref = `/admin/jobs?${new URLSearchParams({
    companyProfileId: data.companyProfileId,
    companyName: data.companyName,
  }).toString()}`;

  // Both ends, one end, or nothing published — the same three cases the
  // recruiter-facing company card renders.
  const { commissionRangeMinMinor: min, commissionRangeMaxMinor: max } = data;
  const commissionRange =
    min === null && max === null
      ? null
      : min !== null && max !== null
        ? `${formatMinor(min)} – ${formatMinor(max)}`
        : formatMinor(min ?? max ?? 0);

  return (
    <div className="flex w-full max-w-5xl flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <CompanyLogo
              companyProfileId={data.companyProfileId}
              hasLogo={data.hasLogo}
              name={data.companyName}
              size="lg"
            />
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-heading text-xl font-bold text-navy">
                  {data.companyName}
                </h2>
                <StatusBadge
                  label={ACCOUNT_STATUS_LABELS[data.status]}
                  className={ACCOUNT_STATUS_STYLES[data.status]}
                />
                <StatusBadge
                  label={VERIFICATION_LABELS[data.verificationStatus]}
                  className={
                    VERIFICATION_STATUS_STYLES[data.verificationStatus] ??
                    "bg-muted text-muted-foreground"
                  }
                />
              </div>
              <p className="text-sm text-muted-foreground">{data.email}</p>
            </div>
          </div>
          <HoldButton
            userId={data.userId}
            status={data.status}
            subjectName={data.companyName}
            holdLabel="Suspend"
            heldLabel="suspended"
          />
        </CardContent>
      </Card>

      <VerificationCard data={data} />

      <Card className="overflow-hidden">
        <CardContent className="flex flex-col divide-y divide-border p-0 sm:flex-row sm:divide-x sm:divide-y-0">
          <WalletStat label="Available" minor={data.availableMinor} primary />
          <WalletStat label="Balance" minor={data.balanceMinor} />
          <WalletStat label="Reserved" minor={data.reservedMinor} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailField label="First name" value={data.firstName} />
            <DetailField label="Last name" value={data.lastName} />
            <DetailField label="Phone" value={data.phone} />
            <DetailField
              label="Email confirmed"
              value={data.emailVerified ? "Yes" : "No"}
            />
            <DetailField label="Location" value={location} />
            <DetailField label="Address" value={data.addressLine} />
            <DetailField label="ZIP" value={data.zip} />
            <DetailField label="Website" value={data.website} />
            <DetailField label="Joined" value={formatDate(data.joinedAt)} />
            <div className="col-span-2">
              <DetailField label="Description" value={data.description} />
            </div>
          </CardContent>
        </Card>

        {/* The sign-up questionnaire. This is what an admin actually reads to
            judge whether a company is real, so it gets its own card rather
            than being buried among the contact fields. */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business profile</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailField label="Industry" value={data.industry} />
            <DetailField
              label="Founded"
              value={
                data.yearFounded !== null ? String(data.yearFounded) : null
              }
            />
            <DetailField label="Employees" value={data.employeeSize} />
            <DetailField label="Revenue" value={data.revenue} />
            <div className="col-span-2">
              <DetailField label="Commission range" value={commissionRange} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
