"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Banknote,
  Landmark,
  PauseCircle,
  ShieldAlert,
} from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { QuickViewBand } from "@/shared/ui-components/dashboard/DashboardParts";
import { ConfirmActionDialog } from "@/shared/ui-components/controls/ConfirmActionDialog";
import { ErrorRetryCallout } from "@/shared/ui-components/feedback/ErrorRetryCallout";
import { TONE_DOT } from "@/shared/ui-components/badges/Pill";
import { TABLE_CARD } from "@/shared/ui-components/data/tableStyles";
import {
  adminCompanyPath,
  adminConversationPath,
  adminDisputePath,
  adminJobPath,
  adminRecruiterPath,
} from "@/shared/utils/entityPaths";
import { formatMinor } from "@/shared/utils/money";
import { useAdminPayout, useReleasePayoutHold } from "../hooks/useAdmin";
import { AddPayoutHoldDialog } from "./AddPayoutHoldDialog";
import {
  DESTINATION_STATUS_LABELS,
  DESTINATION_STATUS_TONES,
  HOLD_REASON_LABELS,
  PAYOUT_VIEW_LABELS,
  PAYOUT_VIEW_TONES,
} from "./financeLabels";
import {
  PAYOUT_HOLD_REASONS,
  type AdminPayoutDetail as Payout,
  type PayoutEvent,
  type PayoutHold,
} from "../schemas";

const DAY_MS = 24 * 60 * 60 * 1000;

function longDay(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function stamp(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Day N of the guarantee, so the band can say how far along the clock is. */
function guaranteeDay(payout: Payout): { day: number; total: number } {
  const joined = new Date(payout.joiningDate).getTime();
  const ends = new Date(payout.eligibleAt).getTime();
  const total = Math.max(1, Math.round((ends - joined) / DAY_MS));
  const elapsed = Math.round((Date.now() - joined) / DAY_MS);
  return { day: Math.max(0, Math.min(elapsed, total)), total };
}

/** Narrows a timeline step's raw reason to one we have wording for. */
function holdReasonLabel(reason: string | null): string | null {
  const match = PAYOUT_HOLD_REASONS.find((known) => known === reason);
  return match ? HOLD_REASON_LABELS[match] : null;
}

/** The sentence each timeline step reads as. The server sends only facts. */
function describe(event: PayoutEvent): { title: string; detail: string } {
  switch (event.kind) {
    case "offer_accepted":
      return { title: "Offer accepted", detail: "The fee was reserved here" };
    case "candidate_joined":
      return {
        title: "Candidate joined",
        detail: "Joining date confirmed by the company",
      };
    case "dispute_opened":
      return {
        title: `Dispute DSP-${event.referenceSerialNumber} opened`,
        detail: "The dispute hold applied automatically",
      };
    case "dispute_resolved":
      return { title: "Dispute resolved", detail: event.note ?? "" };
    case "hold_added":
      return {
        title: "Manual hold added",
        detail: [holdReasonLabel(event.reason), event.actorName]
          .filter(Boolean)
          .join(" · "),
      };
    case "hold_released":
      return {
        title: "Manual hold lifted",
        detail: event.actorName ?? "",
      };
    case "guarantee_ends":
      return {
        title: "Guarantee ends · day 30",
        detail: "It does not move while holds are active",
      };
    case "refunded":
      return {
        title: "Refunded to the company",
        detail: "The commission will not be paid",
      };
    case "released":
      return {
        title: "Released to the recruiter",
        detail: event.at ? "" : "After every hold clears and day 30 has passed",
      };
  }
}

function Timeline({ events }: { events: readonly PayoutEvent[] }) {
  return (
    <ol className="m-0 flex list-none flex-col p-0">
      {events.map((event, index) => {
        const { title, detail } = describe(event);
        const done =
          event.at !== null && new Date(event.at).getTime() <= Date.now();
        const last = index === events.length - 1;
        return (
          <li key={event.key} className="flex gap-3">
            <span className="flex flex-col items-center">
              <span
                aria-hidden="true"
                className={cn(
                  "mt-1.5 size-2.5 shrink-0 rounded-full",
                  done
                    ? event.kind === "dispute_opened" ||
                      event.kind === "hold_added"
                      ? TONE_DOT.warn
                      : "bg-blue"
                    : "border-2 border-line-strong bg-surface",
                )}
              />
              {!last && (
                <span aria-hidden="true" className="w-px flex-1 bg-line" />
              )}
            </span>
            <div className={cn("min-w-0 flex-1", last ? "pb-0" : "pb-5")}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p
                  className={cn(
                    "m-0 text-sub font-[550]",
                    done ? "text-ink" : "text-ink-muted",
                  )}
                >
                  {title}
                </p>
                <span className="shrink-0 text-meta tabular-nums text-ink-muted">
                  {event.at ? longDay(event.at) : "—"}
                </span>
              </div>
              {detail && (
                <p className="m-0 mt-0.5 text-meta text-ink-muted">{detail}</p>
              )}
              {event.note && event.kind === "hold_added" && (
                <p className="m-0 mt-1 text-meta italic text-ink-body">
                  “{event.note}”
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function HoldRow({ hold, payoutRef }: { hold: PayoutHold; payoutRef: string }) {
  const [confirming, setConfirming] = useState(false);
  const release = useReleasePayoutHold(payoutRef);
  const isDispute = hold.kind === "dispute";

  return (
    <div className="flex flex-wrap items-start gap-3 border-b border-line px-5 py-4 last:border-b-0">
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-sm",
          hold.active
            ? "bg-warn-bg text-warn"
            : "bg-surface-sunken text-ink-muted",
        )}
      >
        {isDispute ? (
          <ShieldAlert className="size-4" />
        ) : (
          <PauseCircle className="size-4" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="m-0 text-sub font-[650] text-ink">
          {isDispute
            ? `Dispute hold · DSP-${hold.disputeSerialNumber}`
            : `Manual hold · ${hold.reason ? HOLD_REASON_LABELS[hold.reason] : "Other"}`}
        </p>
        <p className="m-0 mt-0.5 text-sub text-ink-body">
          {isDispute
            ? "Applied automatically when the dispute opened. It clears only when the dispute is resolved."
            : `“${hold.note ?? ""}”`}
        </p>
        <p className="m-0 mt-1 text-meta text-ink-muted">
          {hold.createdByName ?? "System"} · {stamp(hold.createdAt)}
          {hold.releasedAt &&
            ` · lifted by ${hold.releasedByName ?? "an admin"} ${stamp(hold.releasedAt)}`}
        </p>
      </div>
      <div className="shrink-0">
        {isDispute ? (
          <Button asChild variant="outline" size="sm">
            <Link
              href={adminDisputePath({
                id: hold.disputeId ?? "",
                serialNumber: hold.disputeSerialNumber ?? undefined,
              })}
            >
              Open case
            </Link>
          </Button>
        ) : hold.active ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirming(true)}
            >
              Release hold
            </Button>
            <ConfirmActionDialog
              open={confirming}
              onOpenChange={setConfirming}
              title="Lift this hold?"
              description="Any other hold, and any open dispute, still keeps the money where it is. With nothing left holding it, the commission releases on the next run once day 30 has passed."
              confirmLabel="Lift hold"
              pendingLabel="Lifting…"
              isPending={release.isPending}
              onConfirm={() =>
                release.mutate(
                  { holdId: hold.id ?? "" },
                  { onSuccess: () => setConfirming(false) },
                )
              }
            />
          </>
        ) : (
          <StatusBadge label="Lifted" tone="neutral" />
        )}
      </div>
    </div>
  );
}

function SidePanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn(TABLE_CARD, "flex flex-col")}>
      <h2 className="m-0 px-5 pb-2.5 pt-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
        {title}
      </h2>
      <div className="px-5 pb-4">{children}</div>
    </section>
  );
}

/**
 * One commission in full: what is holding it, how it got here, and the two
 * things an admin can actually do about it.
 *
 * Everything shown is read back off a record we keep — there is no event log,
 * so a step we cannot evidence is drawn as not-yet-happened rather than
 * invented.
 */
export function AdminPayoutDetail({ payoutRef }: { payoutRef: string }) {
  const [holding, setHolding] = useState(false);
  const { data, isPending, isError, refetch } = useAdminPayout(payoutRef);

  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-20 w-full animate-pulse rounded-md bg-surface-sub shadow-e1" />
        <div className="h-28 w-full animate-pulse rounded-lg bg-surface-sub shadow-e1" />
        <div className="h-64 w-full animate-pulse rounded-lg bg-surface-sub shadow-e1" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <ErrorRetryCallout
        message="Could not load this payout."
        onRetry={() => void refetch()}
      />
    );
  }

  const activeHolds = data.holds.filter((hold) => hold.active);
  const { day, total } = guaranteeDay(data);
  const destinationStatus = data.destination?.status ?? "none";

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-meta tabular-nums text-ink-muted">
            Recruiter payout · PLC-{data.placementSerialNumber}
          </p>
          <h1 className="m-0 mt-1 flex flex-wrap items-center gap-2.5 text-page font-semibold text-ink">
            {formatMinor(data.commissionMinor)} commission to{" "}
            {data.recruiterName}
            <StatusBadge
              label={PAYOUT_VIEW_LABELS[data.view]}
              tone={PAYOUT_VIEW_TONES[data.view]}
            />
            {activeHolds.length > 0 && (
              <span className="text-sub font-medium text-ink-muted">
                {activeHolds.length} active hold
                {activeHolds.length === 1 ? "" : "s"}
              </span>
            )}
          </h1>
          <p className="m-0 mt-1 text-sub text-ink-muted">
            {data.candidateName} · {data.jobTitle} at {data.companyName}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {data.openDisputeId && (
            <Button asChild variant="outline" size="sm">
              <Link
                href={adminDisputePath({
                  id: data.openDisputeId,
                  serialNumber: data.openDisputeSerialNumber ?? undefined,
                })}
              >
                Open dispute DSP-{data.openDisputeSerialNumber}
              </Link>
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setHolding(true)}
          >
            Add hold
          </Button>
        </div>
      </header>

      <QuickViewBand
        label="Payout summary"
        views={[
          {
            key: "commission",
            label: "Commission",
            value: formatMinor(data.commissionMinor),
            note: "Fixed fee from the job",
            tone: "neutral",
          },
          {
            key: "joined",
            label: "Joined",
            value: longDay(data.joiningDate),
            note: "Confirmed by the company",
            tone: "neutral",
          },
          {
            key: "eligible",
            label: "Eligible",
            value: longDay(data.eligibleAt),
            note: `Day ${day} of ${total}`,
            tone: activeHolds.length > 0 ? "warn" : "info",
          },
          {
            key: "destination",
            label: "Payout Account",
            value: DESTINATION_STATUS_LABELS[destinationStatus] ?? "Unknown",
            note: data.destination?.bankLast4
              ? `${data.destination.bankName ?? "Bank account"} •• ${data.destination.bankLast4}`
              : "No bank account on file yet",
            tone: DESTINATION_STATUS_TONES[destinationStatus] ?? "neutral",
          },
        ]}
      />

      <div className="flex flex-wrap items-start gap-4">
        <div className="flex min-w-0 flex-[2_1_480px] flex-col gap-4">
          <section className={TABLE_CARD}>
            <div className="flex flex-wrap items-center gap-2.5 border-b border-line px-5 py-4">
              <div className="min-w-0 flex-1">
                <h2 className="m-0 text-card font-[650] text-ink">
                  {data.holds.length === 0 ? "Holds" : "Active Holds"}
                </h2>
                <p className="m-0 mt-0.5 text-meta text-ink-muted">
                  Holds stack. The commission releases only when every one has
                  cleared and day {total} has passed.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setHolding(true)}
              >
                Add hold
              </Button>
            </div>
            {data.holds.length === 0 ? (
              <p className="m-0 px-5 py-6 text-sub text-ink-muted">
                Nothing is holding this commission.
              </p>
            ) : (
              <div className="flex flex-col">
                {data.holds.map((hold) => (
                  <HoldRow
                    key={hold.id ?? `dispute-${hold.disputeId}`}
                    hold={hold}
                    payoutRef={payoutRef}
                  />
                ))}
              </div>
            )}
          </section>

          <section className={TABLE_CARD}>
            <h2 className="m-0 border-b border-line px-5 py-4 text-card font-[650] text-ink">
              Payout Timeline
            </h2>
            <div className="px-5 py-4">
              <Timeline events={data.timeline} />
            </div>
          </section>
        </div>

        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <SidePanel title="Placement">
            <dl className="m-0 flex flex-col gap-2.5 text-sub">
              {[
                {
                  label: "Recruiter",
                  value: data.recruiterName,
                  href: adminRecruiterPath({
                    id: data.recruiterUserId,
                    serialNumber: data.recruiterSerialNumber,
                  }),
                },
                {
                  label: "Company",
                  value: data.companyName,
                  href: adminCompanyPath({
                    id: data.companyUserId,
                    serialNumber: data.companySerialNumber,
                  }),
                },
                {
                  label: "Candidate",
                  value: data.candidateName,
                  // No admin candidate page exists; their thread is the record.
                  href: adminConversationPath({
                    id: data.candidateId,
                    serialNumber: data.candidateSerialNumber,
                  }),
                },
                {
                  label: "Job",
                  value: data.jobTitle,
                  href: adminJobPath({
                    id: data.jobId,
                    serialNumber: data.jobSerialNumber,
                  }),
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-3"
                >
                  <dt className="shrink-0 text-ink-muted">{row.label}</dt>
                  <dd className="m-0 min-w-0 truncate text-right">
                    {row.href ? (
                      <Link
                        href={row.href}
                        className="font-medium text-blue-ink hover:underline"
                      >
                        {row.value}
                      </Link>
                    ) : (
                      <span className="text-ink">{row.value}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </SidePanel>

          <SidePanel title="Payout Destination">
            {data.destination ? (
              <div
                className={cn(
                  "flex items-start gap-2.5 rounded-sm px-3 py-2.5",
                  destinationStatus === "verified"
                    ? "bg-ok-bg"
                    : "bg-surface-sunken",
                )}
              >
                <Landmark
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-ink-muted"
                />
                <div className="min-w-0 text-sub">
                  <p className="m-0 font-[550] text-ink">
                    {data.destination.bankName ?? "Bank account"}
                    {data.destination.bankLast4
                      ? ` •• ${data.destination.bankLast4}`
                      : ""}
                  </p>
                  <p className="m-0 mt-0.5 text-meta text-ink-muted">
                    {DESTINATION_STATUS_LABELS[destinationStatus] ??
                      destinationStatus}
                    {data.destination.updatedAt
                      ? ` · last changed ${longDay(data.destination.updatedAt)}`
                      : ""}
                  </p>
                  {data.destination.disabledReason && (
                    <p className="m-0 mt-1 text-meta text-bad">
                      {data.destination.disabledReason}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="m-0 flex gap-2 text-sub text-ink-muted">
                <AlertCircle
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
                This recruiter has not set up a payout account, so nothing can
                be sent yet.
              </p>
            )}
          </SidePanel>

          <SidePanel title="Funded By">
            {data.funding ? (
              <p className="m-0 text-sub text-ink-body">
                {formatMinor(data.funding.amountMinor)} is reserved in{" "}
                <span className="font-medium text-ink">{data.companyName}</span>
                ’s wallet for this fee
                {data.funding.serialNumber
                  ? ` (TXN-${data.funding.serialNumber}`
                  : ""}
                {data.funding.reservedAt
                  ? `, ${longDay(data.funding.reservedAt)})`
                  : data.funding.serialNumber
                    ? ")"
                    : ""}
                .
                <Link
                  href="/admin/payments?linkedTo=placement"
                  className="mt-2 flex items-center gap-1.5 font-medium text-blue-ink hover:underline"
                >
                  <Banknote aria-hidden="true" className="size-3.5" />
                  View in Company payments
                </Link>
              </p>
            ) : (
              <p className="m-0 text-sub text-ink-muted">
                No reservation is recorded against this placement.
              </p>
            )}
          </SidePanel>
        </div>
      </div>

      <AddPayoutHoldDialog
        payoutRef={payoutRef}
        open={holding}
        onOpenChange={setHolding}
      />
    </div>
  );
}
