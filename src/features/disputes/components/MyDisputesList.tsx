"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ShieldAlert } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { formatDate } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { Pill } from "@/shared/ui-components/badges/Pill";
import { Button } from "@/shared/ui-components/controls/button";
import { EmptyState } from "@/shared/ui-components/feedback/EmptyState";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import {
  TABLE_BODY,
  TABLE_CARD,
  TABLE_EL,
  TABLE_HEAD,
  TABLE_HEAD_ROW,
  TABLE_ROW,
  TABLE_ROW_UNREAD,
  TABLE_SCROLL,
  TABLE_TD,
  TABLE_TH,
} from "@/shared/ui-components/data/tableStyles";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/shared/ui-components/mobile-view/MobileRecordCard";

import { useMyDisputes } from "../hooks/useDisputes";
import { DISPUTE_SUBJECT_LABELS, isDisputeOpen } from "../schemas";
import { DisputeStatusBadge } from "./DisputeStatusBadge";

/** Same pill as the inbox's "New": a row still waiting on somebody. An open
 * dispute is an admin decision outstanding, which the status badge alone does
 * not read as at a glance. */
function PendingPill() {
  return (
    <Pill tone="blue" plain className="uppercase tracking-[0.06em]">
      Pending
    </Pill>
  );
}

/** The inbox's left accent bar. On the first cell, not the row: an inset
 * shadow on a `<tr>` doesn't render reliably across browsers. */
const UPDATED_CELL = "shadow-rail";

function UpdateDot() {
  return (
    <span
      className="block size-2.5 shrink-0 rounded-full bg-blue"
      aria-label="New activity"
    />
  );
}

/** The caller's disputes, most recently active first. */
export function MyDisputesList() {
  const [page, setPage] = useState(1);
  const { data, isPending, isError, refetch } = useMyDisputes(page);

  if (isError) {
    return (
      <div className={cn(TABLE_CARD, "p-8")}>
        <div className="flex flex-col items-center gap-3 text-center text-sub text-bad">
          <AlertCircle className="size-[22px]" />
          Could not load your disputes.
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }
  if (isPending) return <TableSkeleton />;

  if (data.data.length === 0) {
    return (
      <div className={TABLE_CARD}>
        <EmptyState
          icon={ShieldAlert}
          title="No disputes"
          description="Use “Raise a Dispute” above to open one on a placement held in escrow."
        />
      </div>
    );
  }

  return (
    <div className={TABLE_CARD}>
      <div className={cn(TABLE_SCROLL, "hidden sm:block")}>
        <table className={TABLE_EL}>
          <thead className={TABLE_HEAD}>
            <tr className={TABLE_HEAD_ROW}>
              <th scope="col" className={TABLE_TH}>
                Role
              </th>
              <th scope="col" className={TABLE_TH}>
                Subject
              </th>
              <th scope="col" className={TABLE_TH}>
                Counterparty
              </th>
              <th scope="col" className={cn(TABLE_TH, "text-right")}>
                Fee
              </th>
              <th scope="col" className={TABLE_TH}>
                Status
              </th>
              <th scope="col" className={TABLE_TH}>
                Opened
              </th>
              <th scope="col" className={TABLE_TH} />
            </tr>
          </thead>
          <tbody className={TABLE_BODY}>
            {data.data.map((d) => (
              <tr
                key={d.id}
                className={d.hasUpdate ? TABLE_ROW_UNREAD : TABLE_ROW}
              >
                <td
                  className={cn(
                    TABLE_TD,
                    "text-ink",
                    d.hasUpdate ? `font-[650] ${UPDATED_CELL}` : "font-[550]",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="flex w-2.5 shrink-0 justify-center">
                      {d.hasUpdate && <UpdateDot />}
                    </span>
                    {d.jobTitle}
                    {isDisputeOpen(d.status) && <PendingPill />}
                  </span>
                </td>
                <td className={cn(TABLE_TD, "text-ink-body")}>
                  {DISPUTE_SUBJECT_LABELS[d.subject]}
                </td>
                <td className={cn(TABLE_TD, "text-ink-muted")}>
                  {d.counterpartyName}
                </td>
                <td
                  className={cn(
                    TABLE_TD,
                    "whitespace-nowrap text-right font-[650] tabular-nums text-ink",
                  )}
                >
                  {formatMinor(d.amountMinor)}
                </td>
                <td className={TABLE_TD}>
                  <DisputeStatusBadge status={d.status} />
                </td>
                <td
                  className={cn(
                    TABLE_TD,
                    "whitespace-nowrap tabular-nums text-ink-muted",
                  )}
                >
                  {formatDate(d.createdAt)}
                </td>
                <td className={cn(TABLE_TD, "text-right")}>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/disputes/${d.id}`}>View</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <MobileRecordList className="sm:hidden">
        {data.data.map((d) => (
          <MobileRecordCard
            key={d.id}
            title={d.jobTitle}
            subtitle={d.counterpartyName}
            trailing={
              <span className="flex items-center gap-1.5">
                {isDisputeOpen(d.status) && <PendingPill />}
                <DisputeStatusBadge status={d.status} />
              </span>
            }
            href={`/disputes/${d.id}`}
            className={cn(d.hasUpdate && "bg-unread shadow-rail")}
            fields={[
              { label: "Subject", value: DISPUTE_SUBJECT_LABELS[d.subject] },
              { label: "Fee", value: formatMinor(d.amountMinor) },
              { label: "Opened", value: formatDate(d.createdAt) },
            ]}
          />
        ))}
      </MobileRecordList>

      {/* `.pager` — the reference's footer rule above the page controls. */}
      <div className="flex items-center justify-between gap-2 border-t border-line px-3.5 py-2.5 text-[12.5px] text-ink-muted">
        <span className="tabular-nums">
          {data.meta.total.toLocaleString()} total · page {page} of{" "}
          {Math.max(data.meta.totalPages, 1)}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= data.meta.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
