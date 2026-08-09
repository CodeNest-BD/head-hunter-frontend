"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { Button } from "@/shared/ui-components/controls/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";
import { useAdminRecruiter } from "../hooks/useAdmin";
import { SUBSCRIPTION_LABELS } from "../schemas";
import { HoldButton } from "./HoldButton";
import { DetailField, DetailSkeleton, initials } from "./DetailPrimitives";
import {
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_STATUS_STYLES,
  SUBSCRIPTION_STATUS_STYLES,
} from "./statusStyles";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function RecruiterDetail({ userId }: { userId: string }) {
  const { data, isPending, isError, refetch } = useAdminRecruiter(userId);

  if (isPending) return <DetailSkeleton />;
  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-sm text-destructive">
          <AlertCircle className="h-6 w-6" />
          Could not load this recruiter.
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const name = `${data.firstName} ${data.lastName}`;
  const location = [data.city, data.state].filter(Boolean).join(", ") || "—";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Link
        href="/admin/recruiters"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> All recruiters
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-bold text-primary">
              {initials(data.firstName, data.lastName)}
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-heading text-xl font-bold text-navy">
                  {name}
                </h2>
                <StatusBadge
                  label={ACCOUNT_STATUS_LABELS[data.status]}
                  className={ACCOUNT_STATUS_STYLES[data.status]}
                />
              </div>
              <p className="text-sm text-muted-foreground">{data.email}</p>
            </div>
          </div>
          <HoldButton
            userId={data.userId}
            status={data.status}
            subjectName={name}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailField label="Phone" value={data.phone} />
            <DetailField label="Location" value={location} />
            <DetailField label="Address" value={data.addressLine} />
            <DetailField label="ZIP" value={data.zip} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Marketplace</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Subscription
              </span>
              <StatusBadge
                label={
                  SUBSCRIPTION_LABELS[data.subscriptionStatus] ??
                  data.subscriptionStatus
                }
                className={
                  SUBSCRIPTION_STATUS_STYLES[data.subscriptionStatus] ??
                  "bg-muted text-muted-foreground"
                }
              />
            </div>
            <DetailField
              label="Renews"
              value={formatDate(data.currentPeriodEnd)}
            />
            <DetailField
              label="Submissions"
              value={String(data.submissionCount)}
            />
            <DetailField
              label="Experience"
              value={
                data.yearsExperience !== null
                  ? `${data.yearsExperience} yrs`
                  : null
              }
            />
            <div className="col-span-2 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Specializations
              </span>
              <span className="text-sm text-navy">
                {data.specializations && data.specializations.length > 0
                  ? data.specializations.join(", ")
                  : "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailField label="Joined" value={formatDate(data.joinedAt)} />
            <DetailField
              label="Last login"
              value={formatDate(data.lastLoginAt)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              References ({data.references.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.references.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No references on file.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.references.map((ref) => (
                  <li
                    key={ref.id}
                    className="rounded-lg border border-border px-3 py-2 text-sm text-navy"
                  >
                    {ref.name}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
