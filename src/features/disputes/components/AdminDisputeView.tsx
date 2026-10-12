"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, Eye, Lock } from "lucide-react";
import { toast } from "sonner";

import { useCanonicalPath } from "@/shared/hooks/useCanonicalPath";
import { allMessages, isApiError } from "@/shared/libs/errorHandler";
import {
  adminCompanyPath,
  adminDisputePath,
  adminJobPath,
  adminPayoutPath,
  adminRecruiterPath,
} from "@/shared/utils/entityPaths";
import { formatDate } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { cn } from "@/shared/libs/shadCnConfig";
import { RatingStars } from "@/shared/ui-components/data/RatingStars";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { ConversationThread } from "@/features/admin/components/ConversationThread";
import { DESTINATION_STATUS_LABELS } from "@/features/admin/components/financeLabels";
import type { RecruiterPayoutAccount } from "@/features/admin/schemas";
import {
  SideFact,
  SideSection,
} from "@/features/admin/components/DetailPrimitives";
import { BackLink } from "@/shared/ui-components/brand";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardContent } from "@/shared/ui-components/controls/card";

import {
  useAdminDispute,
  usePostAdminDisputeMessage,
} from "../hooks/useDisputes";
import {
  DISPUTE_SUBJECT_LABELS,
  isDisputeOpen,
  type AdminDisputeDetail,
  type DisputeSubject,
} from "../schemas";
import { describeCountdown } from "../utils/describeCountdown";
import { DisputeChannelThread } from "./DisputeChannelThread";
import { DisputeProofList } from "./DisputeProofList";
import { DisputeStatusBadge } from "./DisputeStatusBadge";
import { ResolveDisputeCard } from "./ResolveDisputeCard";

const SIDE_LINK = "text-blue-ink hover:underline";

/**
 * Where a release would land. Anything short of verified is amber: releasing
 * to an unverified or restricted account will not pay out.
 */
function PayoutAccountFact({
  account,
}: {
  account: RecruiterPayoutAccount | null;
}) {
  if (!account) return <>{DESTINATION_STATUS_LABELS.none}</>;
  const status = DESTINATION_STATUS_LABELS[account.status] ?? account.status;
  return (
    <span className={account.status === "verified" ? "text-ink" : "text-warn"}>
      {account.bankLast4 ? `${status} · •••• ${account.bankLast4}` : status}
    </span>
  );
}

/** Full admin adjudication view: context, both channels, and resolution. */
export function AdminDisputeView({ disputeRef }: { disputeRef: string }) {
  const { data, isPending, isError, refetch } = useAdminDispute(disputeRef);
  const post = usePostAdminDisputeMessage();
  useCanonicalPath(data && adminDisputePath(data));

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-sub text-bad">
          <AlertCircle className="size-[22px]" />
          Could not load this dispute.
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }
  if (isPending) {
    return (
      <div className="h-40 animate-pulse rounded-md border border-line bg-surface-sub" />
    );
  }

  const open = isDisputeOpen(data.status);

  // Both channels post through one mutation, so `isPending` alone would put
  // the other channel's composer into "Sending…" too. The in-flight variables
  // say which one is actually busy.
  const sendingTo = (channel: "company" | "recruiter"): boolean =>
    post.isPending && post.variables?.channel === channel;

  const sendTo = (channel: "company" | "recruiter") => (body: string) => {
    post.mutate(
      { disputeId: data.id, channel, body },
      {
        onError: (error) =>
          toast.error(
            isApiError(error) ? allMessages(error) : "Could not send message.",
          ),
      },
    );
  };

  return <DisputeBody data={data} sendTo={sendTo} sendingTo={sendingTo} />;
}

/** The amber band the case leads with: the money, the dates, the clock. */
function CaseBand({ data }: { data: AdminDisputeDetail }) {
  const { day, total } = guaranteeDay(data);
  const daysToPayout = Math.round(
    (new Date(data.holdExpiresAt).getTime() - Date.now()) / DAY_MS,
  );
  const facts = [
    {
      label: "Fee held",
      value: formatMinor(data.amountMinor),
      note: "Agreed in the offer",
    },
    {
      label: "Original payout date",
      value: formatDate(data.holdExpiresAt),
      // The dispute pauses the payment, never the clock — the whole band
      // exists to make that unambiguous.
      note:
        daysToPayout >= 0
          ? `In ${daysToPayout} day${daysToPayout === 1 ? "" : "s"} · unchanged by the dispute`
          : "Passed · unchanged by the dispute",
    },
    {
      label: "Guarantee",
      value: `Day ${day} of ${total}`,
      note: `Candidate joined ${formatDate(data.joiningDate)}`,
    },
    {
      label: "Raised by",
      value: data.raisedBy === "company" ? "Company" : "Recruiter",
      note: `Opened ${formatDate(data.createdAt)}`,
    },
  ];
  return (
    <section
      aria-label="Case summary"
      className="overflow-hidden rounded-lg bg-warn-bg/50 shadow-[0_0_0_1px_theme(colors.warn.line)]"
    >
      <dl className="m-0 grid [grid-template-columns:repeat(auto-fit,minmax(190px,1fr))]">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="flex flex-col gap-1 px-6 py-4.5 shadow-[inset_-1px_0_0_theme(colors.warn.line)] last:shadow-none"
          >
            <dt className="text-meta font-medium text-warn">{fact.label}</dt>
            <dd className="m-0 text-[26px] font-semibold leading-8 tracking-[-0.02em] tabular-nums text-ink">
              {fact.value}
            </dd>
            <dd className="m-0 text-meta leading-[18px] text-ink-muted">
              {fact.note}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** The subject's wording, falling back to the raw value for one we have not
 *  been taught yet rather than rendering an empty cell. */
function subjectLabel(subject: DisputeSubject): string {
  return DISPUTE_SUBJECT_LABELS[subject] ?? subject;
}

/** Day N of the guarantee, clamped to the window. */
function guaranteeDay(data: AdminDisputeDetail): {
  day: number;
  total: number;
} {
  const joined = new Date(data.joiningDate).getTime();
  const ends = new Date(data.holdExpiresAt).getTime();
  const total = Math.max(1, Math.round((ends - joined) / DAY_MS));
  const elapsed = Math.round((Date.now() - joined) / DAY_MS);
  return { day: Math.max(0, Math.min(elapsed, total)), total };
}

type Channel = "shared" | "company" | "recruiter";

function DisputeBody({
  data,
  sendTo,
  sendingTo,
}: {
  data: AdminDisputeDetail;
  sendTo: (channel: "company" | "recruiter") => (body: string) => void;
  sendingTo: (channel: "company" | "recruiter") => boolean;
}) {
  const [channel, setChannel] = useState<Channel>("shared");
  const open = isDisputeOpen(data.status);

  const tabs: { key: Channel; label: string; count?: number }[] = [
    { key: "shared", label: "Company ↔ Recruiter" },
    { key: "company", label: "Company", count: data.companyMessages.length },
    {
      key: "recruiter",
      label: "Recruiter",
      count: data.recruiterMessages.length,
    },
  ];

  return (
    <div className="flex w-full flex-col gap-6">
      {/* No `flex-wrap`: the sub-line is long enough that wrapping would push
          the action onto its own row below it, when it belongs beside the
          title. `min-w-0` lets the line wrap inside its own column instead. */}
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <BackLink href="/admin/disputes">Dispute Center</BackLink>
          <div className="mt-1 flex flex-wrap items-center gap-2.5">
            <h1 className="text-page font-bold text-ink">
              {subjectLabel(data.subject)}
            </h1>
            <DisputeStatusBadge status={data.status} />
            {open && <StatusBadge label="Payment on hold" tone="warn" />}
          </div>
          <p className="mt-1 text-sub text-ink-muted">
            {data.serialNumber ? `DSP-${data.serialNumber} · ` : ""}
            {data.candidateName} · {data.jobTitle} · {data.companyName} ↔{" "}
            {data.recruiterName} · Opened {formatDate(data.createdAt)} by the{" "}
            {data.raisedBy}
          </p>
        </div>
        <Button asChild variant="outline" className="shrink-0">
          {/* An open dispute always holds its placement, so the board's
              Disputed slice is guaranteed to contain it — the row is on the
              first page rather than somewhere down the full list. */}
          <Link
            href={`/admin/offers-placements?${new URLSearchParams({
              placement: data.placementId,
              view: "disputed",
            }).toString()}`}
          >
            View placement
          </Link>
        </Button>
      </header>

      <CaseBand data={data} />

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[3_1_600px] flex-col gap-6">
          <section className="overflow-hidden rounded-md bg-surface shadow-e1">
            <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4">
              <h2 className="text-card font-[650] text-ink">Conversations</h2>
              <p className="m-0 text-sub text-ink-muted">
                Admin can read the shared thread and message each party
                privately
              </p>
            </div>
            <div
              role="tablist"
              aria-label="Dispute channels"
              className="flex flex-wrap gap-x-6 px-6 shadow-[inset_0_-1px_0_theme(colors.line.DEFAULT)]"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={channel === tab.key}
                  onClick={() => setChannel(tab.key)}
                  className={cn(
                    "flex h-11 items-center gap-1.5 text-sub transition-colors",
                    channel === tab.key
                      ? "font-[650] text-ink shadow-[inset_0_-2px_0_theme(colors.blue.DEFAULT)]"
                      : "font-medium text-ink-muted hover:text-ink",
                  )}
                >
                  {tab.key !== "shared" && (
                    <Lock className="size-3.5" aria-hidden="true" />
                  )}
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="tabular-nums text-ink-faint">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <p className="m-0 flex items-center gap-2 bg-surface-sub px-6 py-2.5 text-meta text-ink-muted">
              <Eye className="size-3.5 shrink-0" aria-hidden="true" />
              {channel === "shared"
                ? `Shared thread between ${data.companyName} and ${data.recruiterName}. Both can see it; admin reads it here.`
                : `Private — the ${channel === "company" ? "recruiter" : "company"} won’t see it.`}
            </p>
            <div className="p-6">
              {channel === "shared" ? (
                <ConversationThread embedded candidateRef={data.candidateId} />
              ) : (
                <DisputeChannelThread
                  messages={
                    channel === "company"
                      ? data.companyMessages
                      : data.recruiterMessages
                  }
                  onSend={sendTo(channel)}
                  sending={sendingTo(channel)}
                  disabled={!open}
                  placeholder={`Write privately to the ${channel}…`}
                  emptyLabel="No messages on this channel yet."
                />
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-md bg-surface shadow-e1">
            <div className="px-6 py-4">
              <h2 className="m-0 text-card font-[650] text-ink">
                Dispute details
              </h2>
            </div>
            <div className="border-t border-line px-6 py-4">
              <dl className="m-0 grid gap-x-6 gap-y-3 sm:grid-cols-[140px_1fr]">
                <dt className="text-sub text-ink-muted">Reason</dt>
                <dd className="m-0 text-sub font-medium text-ink">
                  {subjectLabel(data.subject)}
                </dd>
                <dt className="text-sub text-ink-muted">Description</dt>
                <dd className="m-0 whitespace-pre-line text-sub text-ink-body">
                  {data.reason}
                </dd>
                <dt className="text-sub text-ink-muted">Raised by</dt>
                <dd className="m-0 text-sub text-ink">
                  {data.raisedBy === "company"
                    ? `${data.companyName} (company)`
                    : `${data.recruiterName} (recruiter)`}
                </dd>
                <dt className="text-sub text-ink-muted">Release countdown</dt>
                <dd className="m-0 text-sub text-ink-body">
                  {describeCountdown(data.countdown)}
                </dd>
                {data.resolutionNote && (
                  <>
                    <dt className="text-sub text-ink-muted">Resolution note</dt>
                    <dd className="m-0 whitespace-pre-line text-sub text-ink-body">
                      {data.resolutionNote}
                    </dd>
                  </>
                )}
              </dl>
            </div>
            <div className="border-t border-line px-6 py-4">
              <h3 className="mb-3 mt-0 text-sub font-[650] text-ink">
                Evidence · {data.attachments.length}
              </h3>
              <DisputeProofList attachments={data.attachments} />
            </div>
          </section>
        </div>

        <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
          <ResolveDisputeCard dispute={data} />

          <div className="rounded-md bg-surface shadow-e1">
            <SideSection title="Placement">
              <dl className="m-0 flex flex-col gap-2.5">
                <SideFact label="Candidate" value={data.candidateName} />
                <SideFact
                  label="Job"
                  value={
                    <Link
                      href={adminJobPath({
                        id: data.jobId,
                        serialNumber: data.jobSerialNumber,
                      })}
                      className={SIDE_LINK}
                    >
                      {data.jobTitle}
                    </Link>
                  }
                />
                <SideFact
                  label="Company"
                  value={
                    <Link
                      href={adminCompanyPath({
                        id: data.companyUserId,
                        serialNumber: data.companySerialNumber,
                      })}
                      className={SIDE_LINK}
                    >
                      {data.companyName}
                    </Link>
                  }
                />
                <SideFact
                  label="Recruiter"
                  value={
                    <>
                      <Link
                        href={adminRecruiterPath({
                          id: data.recruiterUserId,
                          serialNumber: data.recruiterSerialNumber,
                        })}
                        className={SIDE_LINK}
                      >
                        {data.recruiterName}
                      </Link>
                      <span className="text-ink-muted"> · </span>
                      <RatingStars
                        variant="text"
                        value={data.recruiterRatingAvg}
                        count={data.recruiterRatingCount}
                      />
                    </>
                  }
                />
              </dl>
            </SideSection>

            <SideSection
              title="Payment"
              action={
                <Link
                  href={adminPayoutPath({ id: data.placementId })}
                  className="text-sub font-medium text-blue-ink hover:underline"
                >
                  View transaction
                </Link>
              }
            >
              <dl className="m-0 flex flex-col gap-2.5">
                <SideFact
                  label="Amount"
                  value={
                    <span className="tabular-nums">
                      {formatMinor(data.amountMinor)}
                    </span>
                  }
                />
                <SideFact
                  label="Status"
                  value={
                    <span className={open ? "text-warn" : "text-ink"}>
                      {open ? "On hold · dispute" : "Settled"}
                    </span>
                  }
                />
                <SideFact
                  label="Held since"
                  value={formatDate(data.createdAt)}
                />
                <SideFact
                  label="Original payout"
                  value={formatDate(data.holdExpiresAt)}
                />
                <SideFact
                  label="Payout account"
                  value={<PayoutAccountFact account={data.payoutAccount} />}
                />
              </dl>
            </SideSection>

            <SideSection title="Hiring Timeline">
              <ol className="m-0 list-none p-0">
                {[
                  {
                    label: "Candidate joined",
                    at: data.joiningDate,
                    done: true,
                  },
                  {
                    label: "Dispute opened · payout held",
                    at: data.createdAt,
                    done: true,
                  },
                  {
                    label: data.resolvedAt
                      ? "Dispute resolved"
                      : "Original payout date",
                    at: data.resolvedAt ?? data.holdExpiresAt,
                    done: Boolean(data.resolvedAt),
                  },
                ].map((step) => (
                  <li
                    key={step.label}
                    className="flex items-center justify-between gap-3 py-1.5 text-sub"
                  >
                    <span className="flex items-center gap-2 text-ink">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          step.done ? "bg-ok-dot" : "bg-line-strong",
                        )}
                      />
                      {step.label}
                    </span>
                    <span className="shrink-0 tabular-nums text-ink-muted">
                      {formatDate(step.at)}
                    </span>
                  </li>
                ))}
              </ol>
            </SideSection>
          </div>
        </aside>
      </div>
    </div>
  );
}
