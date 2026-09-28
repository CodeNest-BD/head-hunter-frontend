"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { RaiseDisputeForm } from "@/features/disputes";
import { cn } from "@/shared/libs/shadCnConfig";
import { allMessages, isApiError } from "@/shared/libs/errorHandler";
import { formatDate } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { ConfirmAction } from "@/shared/ui-components/controls/ConfirmAction";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import * as T from "@/shared/ui-components/data/tableStyles";
import { Button } from "@/shared/ui-components/controls/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";
import { EmptyState } from "@/shared/ui-components/feedback/EmptyState";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/shared/ui-components/mobile-view/MobileRecordCard";
import {
  ColumnFilter,
  FilterableHead,
} from "@/shared/ui-components/data/ColumnFilter";
import {
  ColumnsToggle,
  useClearFilterWhenHidden,
  useVisibleColumns,
  type ColumnDef,
} from "@/shared/ui-components/data/Columns";
import { useCompanyPlacements, useRejectPlacement } from "../hooks/useBilling";
import { BillingTableFooter } from "./BillingTable";
import {
  PLACEMENT_STATUS_LABELS,
  type CompanyPlacement,
  type PlacementStatus,
} from "../schemas";
import { PLACEMENT_STATUS_TONES } from "../statusTones";

/** Every escrow state, labelled exactly as the row's own pill labels it. */
const PLACEMENT_STATUS_OPTIONS = (
  Object.entries(PLACEMENT_STATUS_LABELS) as [PlacementStatus, string][]
).map(([value, label]) => ({ value, label }));

const COLUMNS: ColumnDef[] = [
  // The candidate names the row, and the last column is where a company acts
  // on the hold — neither can be switched off.
  { key: "candidate", label: "Candidate", required: true },
  { key: "role", label: "Role" },
  { key: "recruiter", label: "Recruiter" },
  { key: "fee", label: "Fee" },
  { key: "status", label: "Status" },
  { key: "settle", label: "Released / hold ends" },
  { key: "action", label: "Action", required: true },
];

/** A placement can be rejected only while its fee is held and the candidate has
 * not reached their joining date — the countdown starts at midnight UTC that
 * day, the same cut-off the backend enforces. After it, only a dispute can
 * bring the fee back. */
function isRejectable(placement: CompanyPlacement): boolean {
  return (
    placement.status === "held" &&
    new Date(`${placement.joiningDate}T00:00:00.000Z`).getTime() > Date.now()
  );
}

/** A dispute can be opened on any held placement (the escalation path). */
function isDisputable(placement: CompanyPlacement): boolean {
  return placement.status === "held";
}

function rejectErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return allMessages(error);
  }
  return "Could not reject this placement. Please try again.";
}

function PlacementStatusBadge({ status }: { status: PlacementStatus }) {
  return (
    <StatusBadge
      label={PLACEMENT_STATUS_LABELS[status] ?? status}
      tone={PLACEMENT_STATUS_TONES[status] ?? "neutral"}
    />
  );
}

/** Released placements show when they paid out; held ones when they will. */
const settleLabel = (placement: CompanyPlacement): string =>
  placement.releasedAt
    ? formatDate(placement.releasedAt)
    : formatDate(placement.holdExpiresAt);

/**
 * `onReset` is passed only when a filter is what emptied the list — the header
 * row carrying the Status filter is replaced by this card, so without a way out
 * from here a reader who filters to a state they have none of is stuck.
 */
function PlacementsEmpty({ onReset }: { onReset?: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Placements &amp; Escrow</CardTitle>
      </CardHeader>
      <EmptyState
        icon={ShieldCheck}
        title="No placements yet"
        description="When a candidate accepts your offer, its recruiter fee is held in escrow and appears here. It releases to the recruiter 30 days after the candidate joins. You can reject the hire until the joining date; after that, raise a dispute."
        action={
          onReset ? (
            <Button type="button" variant="outline" size="sm" onClick={onReset}>
              Reset filters
            </Button>
          ) : undefined
        }
      />
    </Card>
  );
}

/**
 * The company's escrow view: every placement it is funding, with a "Reject &amp;
 * refund" action on placements whose candidate has not joined yet. Rejecting
 * returns the held fee to the wallet and reopens the job.
 */
export function CompanyPlacementsPanel() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [disputingId, setDisputingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const { data, isPending, isError, refetch } = useCompanyPlacements(
    page,
    status ?? undefined,
  );
  const changeStatus = (next: string | null) => {
    setStatus(next);
    setPage(1);
  };
  const reject = useRejectPlacement();
  const cols = useVisibleColumns("company.placements.columns", COLUMNS);
  // A filter control lives in its column header, so hiding the column would
  // leave the filter narrowing the list with nothing to explain it — and
  // column visibility is persisted, so that would survive a reload.
  useClearFilterWhenHidden(cols.isVisible("status"), () => {
    changeStatus(null);
  });

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-sub text-bad">
          <AlertCircle className="size-[17px]" />
          Could not load your placements.
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isPending) {
    /* Match whatever columns this reader has left switched on. */
    return (
      <TableSkeleton columns={cols.allKeys.filter(cols.isVisible).length} />
    );
  }
  if (data.data.length === 0) {
    return (
      <PlacementsEmpty
        onReset={status !== null ? () => changeStatus(null) : undefined}
      />
    );
  }

  const confirming = confirmingId
    ? data.data.find((p) => p.placementId === confirmingId)
    : undefined;
  const disputing = disputingId
    ? data.data.find((p) => p.placementId === disputingId)
    : undefined;

  const onReject = (placementId: string): void => {
    reject.mutate(placementId, {
      onSuccess: () => {
        toast.success(
          "Hire rejected — the held fee was refunded to your wallet.",
        );
        setConfirmingId(null);
      },
      onError: (error) => toast.error(rejectErrorMessage(error)),
    });
  };

  return (
    <div className={T.TABLE_CARD}>
      <CardHeader>
        <CardTitle>Placements &amp; Escrow</CardTitle>
        <div className="ml-auto">
          <ColumnsToggle
            columns={cols.columns}
            isVisible={cols.isVisible}
            onToggle={cols.toggle}
          />
        </div>
        <CardDescription>
          Fees held for your hires. Each releases to the recruiter 30 days after
          the joining date. Reject a hire before the joining date to refund it;
          after that, raise a dispute.
        </CardDescription>
      </CardHeader>

      {confirming ? (
        <div className="border-b border-line p-4">
          <ConfirmAction
            message={`Reject ${confirming.candidateName} and refund ${formatMinor(
              confirming.amountMinor,
            )} to your wallet? This reopens the role and cannot be undone.`}
            confirmLabel="Reject & refund"
            busyLabel="Refunding…"
            busy={reject.isPending}
            onConfirm={() => onReject(confirming.placementId)}
            onCancel={() => setConfirmingId(null)}
          />
        </div>
      ) : null}

      {disputing ? (
        <div className="border-b border-line p-4">
          <RaiseDisputeForm
            placementId={disputing.placementId}
            party="company"
            onCancel={() => setDisputingId(null)}
            onRaised={(id) => {
              setDisputingId(null);
              router.push(`/disputes/${id}`);
            }}
          />
        </div>
      ) : null}

      <div className={cn("hidden sm:block", T.TABLE_SCROLL)}>
        <table className={T.TABLE_EL}>
          <thead className={T.TABLE_HEAD}>
            <tr>
              <th scope="col" className={cn(T.TABLE_TH, "w-[22%]")}>
                Candidate
              </th>
              {cols.isVisible("role") && (
                <th scope="col" className={T.TABLE_TH}>
                  Role
                </th>
              )}
              {cols.isVisible("recruiter") && (
                <th scope="col" className={T.TABLE_TH}>
                  Recruiter
                </th>
              )}
              {cols.isVisible("fee") && (
                <th scope="col" className={cn(T.TABLE_TH, "text-right")}>
                  Fee
                </th>
              )}
              {cols.isVisible("status") && (
                <FilterableHead label="Status">
                  <ColumnFilter
                    label="Status"
                    options={PLACEMENT_STATUS_OPTIONS}
                    value={status}
                    onChange={changeStatus}
                  />
                </FilterableHead>
              )}
              {cols.isVisible("settle") && (
                <th scope="col" className={T.TABLE_TH}>
                  Released / hold ends
                </th>
              )}
              <th scope="col" className={cn(T.TABLE_TH, "text-right")}>
                Action
              </th>
            </tr>
          </thead>
          <tbody className={T.TABLE_BODY}>
            {data.data.map((p) => (
              <tr key={p.placementId} className={T.TABLE_ROW}>
                <td className={cn(T.TABLE_TD, T.TABLE_CELL_MAIN)}>
                  {p.candidateName}
                </td>
                {cols.isVisible("role") && (
                  <td className={cn(T.TABLE_TD, "text-ink-body")}>
                    <span className="block max-w-[200px] truncate">
                      {p.jobTitle}
                    </span>
                  </td>
                )}
                {cols.isVisible("recruiter") && (
                  <td className={cn(T.TABLE_TD, "text-ink-body")}>
                    {p.recruiterName}
                  </td>
                )}
                {cols.isVisible("fee") && (
                  <td
                    className={cn(
                      T.TABLE_TD,
                      "whitespace-nowrap text-right font-[650] tabular-nums text-ink",
                    )}
                  >
                    {formatMinor(p.amountMinor)}
                  </td>
                )}
                {cols.isVisible("status") && (
                  <td className={T.TABLE_TD}>
                    <PlacementStatusBadge status={p.status} />
                  </td>
                )}
                {cols.isVisible("settle") && (
                  <td
                    className={cn(
                      T.TABLE_TD,
                      "whitespace-nowrap tabular-nums text-ink-body",
                    )}
                  >
                    {settleLabel(p)}
                  </td>
                )}
                <td className={T.TABLE_TD}>
                  <div className="flex justify-end gap-2">
                    {isRejectable(p) ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={reject.isPending}
                        onClick={() => {
                          setDisputingId(null);
                          setConfirmingId(p.placementId);
                        }}
                      >
                        Reject
                      </Button>
                    ) : null}
                    {isDisputable(p) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setConfirmingId(null);
                          setDisputingId(p.placementId);
                        }}
                      >
                        Dispute
                      </Button>
                    ) : null}
                    {!isRejectable(p) && !isDisputable(p) ? (
                      <span className="text-meta text-ink-faint">
                        {p.status === "disputed" ? "In dispute" : "—"}
                      </span>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <MobileRecordList className="sm:hidden">
        {data.data.map((p) => (
          <MobileRecordCard
            key={p.placementId}
            title={p.candidateName}
            subtitle={`${p.jobTitle} · ${p.recruiterName}`}
            trailing={<PlacementStatusBadge status={p.status} />}
            fields={[
              { label: "Fee", value: formatMinor(p.amountMinor) },
              { label: "Released / hold ends", value: settleLabel(p) },
            ]}
            actions={
              isRejectable(p) || isDisputable(p) ? (
                <div className="flex w-full gap-2">
                  {isRejectable(p) ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={reject.isPending}
                      onClick={() => {
                        setDisputingId(null);
                        setConfirmingId(p.placementId);
                      }}
                    >
                      Reject
                    </Button>
                  ) : null}
                  {isDisputable(p) ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setConfirmingId(null);
                        setDisputingId(p.placementId);
                      }}
                    >
                      Dispute
                    </Button>
                  ) : null}
                </div>
              ) : undefined
            }
          />
        ))}
      </MobileRecordList>

      <BillingTableFooter
        total={data.meta.total}
        page={page}
        totalPages={data.meta.totalPages}
        onPage={setPage}
      />
    </div>
  );
}
