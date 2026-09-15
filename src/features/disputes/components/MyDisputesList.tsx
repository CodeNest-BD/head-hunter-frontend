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
import { DisputeStatusBadge } from "./DisputeStatusBadge";

const TH = "px-5 py-3 font-semibold";
const HEAD_ROW =
  "border-b border-border bg-muted/40 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground";
const BODY_ROW =
  "border-b border-border/60 transition-colors last:border-0 even:bg-muted/20 hover:bg-accent/50";

/** The caller's disputes, newest first. */
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
            You can open a dispute on a placement held in escrow from your
            wallet.
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
                <tr key={d.id} className={BODY_ROW}>
                  <td className="px-5 py-3 font-medium text-navy">
                    {d.jobTitle}
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
              trailing={<DisputeStatusBadge status={d.status} />}
              href={`/disputes/${d.id}`}
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
