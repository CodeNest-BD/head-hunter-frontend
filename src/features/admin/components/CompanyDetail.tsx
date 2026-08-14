"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";
import { useAdminCompany } from "../hooks/useAdmin";
import { HoldButton } from "./HoldButton";
import { DetailField, DetailSkeleton } from "./DetailPrimitives";
import { ACCOUNT_STATUS_LABELS, ACCOUNT_STATUS_STYLES } from "./statusStyles";

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
    <div className="flex-1 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p
        className={
          "mt-2 font-heading font-extrabold leading-none " +
          (primary ? "text-4xl text-primary" : "text-[26px] text-navy")
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

  return (
    <div className="flex w-full max-w-5xl flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-heading text-xl font-bold text-navy">
                {data.companyName}
              </h2>
              <StatusBadge
                label={ACCOUNT_STATUS_LABELS[data.status]}
                className={ACCOUNT_STATUS_STYLES[data.status]}
              />
            </div>
            <p className="text-sm text-muted-foreground">{data.email}</p>
          </div>
          <HoldButton
            userId={data.userId}
            status={data.status}
            subjectName={data.companyName}
          />
        </CardContent>
      </Card>

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
            <DetailField label="Phone" value={data.phone} />
            <DetailField label="Location" value={location} />
            <DetailField label="Website" value={data.website} />
            <DetailField label="Joined" value={formatDate(data.joinedAt)} />
            <div className="col-span-2">
              <DetailField label="Description" value={data.description} />
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
