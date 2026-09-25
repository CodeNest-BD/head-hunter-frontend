"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ShieldAlert } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { formatDate } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardContent } from "@/shared/ui-components/controls/card";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/shared/ui-components/mobile-view/MobileRecordCard";

import { useMyDisputes } from "../hooks/useDisputes";
import { isDisputeOpen } from "../schemas";
import { DisputeStatusBadge } from "./DisputeStatusBadge";

/** Same pill as the inbox's "New": a row still waiting on somebody. An open
 * dispute is an admin decision outstanding, which the status badge alone does
 * not read as at a glance. */
function PendingPill() {
  return (
    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
      Pending
    </span>
  );
}

const TH = "px-5 py-3 font-semibold";
const HEAD_ROW =
  "border-b border-border bg-muted/40 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground";
const BODY_ROW =
  "border-b border-border/60 transition-colors last:border-0 even:bg-muted/20 hover:bg-accent/50";

/** A dispute with news the caller hasn't opened yet — tinted like an unread
 * conversation in the inbox. */
const UPDATED_ROW =
  "bg-primary/[0.04] even:bg-primary/[0.04] hover:bg-primary/[0.08]";
/** The inbox's left accent bar. On the first cell, not the row: an inset
 * shadow on a `<tr>` doesn't render reliably across browsers. */
const UPDATED_CELL = "shadow-[inset_3px_0_0_0_hsl(var(--primary))]";

function UpdateDot() {
  return (
    <span
      className="block h-2.5 w-2.5 shrink-0 rounded-full bg-primary"
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
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-sm text-destructive">
          <AlertCircle className="h-6 w-6" />
          Could not load your disputes.
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }
  if (isPending) return <TableSkeleton />;

  if (data.data.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-3 p-8">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-primary">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <p className="text-sm font-semibold text-navy">No disputes</p>
          <p className="text-[13px] text-muted-foreground">
            Use “Raise a Dispute” above to open one on a placement held in
            escrow.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className={HEAD_ROW}>
                <th scope="col" className={TH}>
                  Role
                </th>
                <th scope="col" className={TH}>
                  Counterparty
                </th>
                <th scope="col" className={cn(TH, "text-right")}>
                  Fee
                </th>
                <th scope="col" className={TH}>
                  Status
                </th>
                <th scope="col" className={TH}>
                  Opened
                </th>
                <th scope="col" className={TH} />
              </tr>
            </thead>
            <tbody>
              {data.data.map((d) => (
                <tr
                  key={d.id}
                  className={cn(BODY_ROW, d.hasUpdate && UPDATED_ROW)}
                >
                  <td
                    className={cn(
                      "px-5 py-3 text-navy",
                      d.hasUpdate ? `font-bold ${UPDATED_CELL}` : "font-medium",
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
                  <td className="px-5 py-3 text-muted-foreground">
                    {d.counterpartyName}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-medium text-navy">
                    {formatMinor(d.amountMinor)}
                  </td>
                  <td className="px-5 py-3">
                    <DisputeStatusBadge status={d.status} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                    {formatDate(d.createdAt)}
                  </td>
                  <td className="px-5 py-3 text-right">
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
              className={cn(d.hasUpdate && UPDATED_ROW)}
              fields={[
                { label: "Fee", value: formatMinor(d.amountMinor) },
                { label: "Opened", value: formatDate(d.createdAt) },
              ]}
            />
          ))}
        </MobileRecordList>

        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
          <span className="text-muted-foreground">
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
      </CardContent>
    </Card>
  );
}
