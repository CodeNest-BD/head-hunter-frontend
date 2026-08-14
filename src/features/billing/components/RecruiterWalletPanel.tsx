"use client";

import { useState } from "react";
import { AlertCircle, Wallet2 } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { formatDate } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardContent } from "@/shared/ui-components/controls/card";
import {
  useRecruiterPlacements,
  useRecruiterWallet,
} from "../hooks/useBilling";
import {
  PLACEMENT_STATUS_LABELS,
  type PlacementStatus,
  type RecruiterWalletSummary,
} from "../schemas";

const STATUS_STYLES: Record<PlacementStatus, string> = {
  released: "bg-[#E7F4EC] text-[#17734E]",
  held: "bg-[#FBF3DF] text-[#7A5109]",
  releasing: "bg-primary/15 text-primary",
  disputed: "bg-[#FBEAEA] text-[#9B3535]",
  refunded: "bg-muted text-muted-foreground",
};

function Metric({
  label,
  valueMinor,
  hint,
  primary = false,
}: {
  label: string;
  valueMinor: number | undefined;
  hint: string;
  primary?: boolean;
}) {
  return (
    <div className="flex-1 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-heading font-extrabold leading-none text-navy",
          primary ? "text-4xl text-primary" : "text-[26px]",
        )}
      >
        {valueMinor === undefined ? "—" : formatMinor(valueMinor)}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function WalletSummaryCard({ data }: { data?: RecruiterWalletSummary }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col divide-y divide-border p-0 sm:flex-row sm:divide-x sm:divide-y-0">
        <Metric
          label="Paid out"
          valueMinor={data?.releasedMinor}
          hint="Commission released to you"
          primary
        />
        <Metric
          label="In escrow"
          valueMinor={data?.inEscrowMinor}
          hint={
            data?.nextReleaseAt
              ? `Next release ${formatDate(data.nextReleaseAt)}`
              : "Awaiting the 30-day release"
          }
        />
        <Metric
          label="In dispute"
          valueMinor={data?.inDisputeMinor}
          hint="Held pending a dispute"
        />
      </CardContent>
    </Card>
  );
}

const TH = "px-5 py-3 font-semibold";
const HEAD_ROW =
  "border-b border-border bg-muted/40 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground";
const BODY_ROW =
  "border-b border-border/60 transition-colors last:border-0 even:bg-muted/20 hover:bg-accent/50";

function PlacementsTable() {
  const [page, setPage] = useState(1);
  const { data, isPending, isError, refetch } = useRecruiterPlacements(page);

  if (isPending) return <TableSkeleton />;
  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-sm text-destructive">
          <AlertCircle className="h-6 w-6" />
          Could not load your placements.
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (data.data.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
            <Wallet2 className="h-6 w-6" />
          </span>
          <p className="text-sm font-semibold text-navy">No placements yet</p>
          <p className="text-sm text-muted-foreground">
            Your commission appears here once a candidate you placed is hired.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className={HEAD_ROW}>
                <th scope="col" className={TH}>
                  Company
                </th>
                <th scope="col" className={TH}>
                  Role
                </th>
                <th scope="col" className={TH}>
                  Candidate
                </th>
                <th scope="col" className={cn(TH, "text-right")}>
                  Commission
                </th>
                <th scope="col" className={TH}>
                  Status
                </th>
                <th scope="col" className={TH}>
                  Released / hold ends
                </th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((p) => (
                <tr key={p.placementId} className={BODY_ROW}>
                  <td className="px-5 py-3 font-medium text-navy">
                    {p.companyName}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    <span className="block max-w-[200px] truncate">
                      {p.jobTitle}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {p.candidateName}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-medium text-navy">
                    {formatMinor(p.amountMinor)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge
                      label={PLACEMENT_STATUS_LABELS[p.status] ?? p.status}
                      className={
                        STATUS_STYLES[p.status] ??
                        "bg-muted text-muted-foreground"
                      }
                    />
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                    {p.releasedAt
                      ? formatDate(p.releasedAt)
                      : formatDate(p.holdExpiresAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= data.meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Recruiter earnings: escrow summary + placement history. */
export function RecruiterWalletPanel() {
  const { data } = useRecruiterWallet();

  return (
    <div className="flex flex-col gap-8">
      <WalletSummaryCard data={data} />
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-navy">Placements</h2>
        <PlacementsTable />
      </section>
    </div>
  );
}
