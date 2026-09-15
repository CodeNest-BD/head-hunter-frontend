"use client";

import { useState } from "react";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/shared/libs/shadCnConfig";
import { allMessages, isApiError } from "@/shared/libs/errorHandler";
import { formatDate } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { ConfirmAction } from "@/shared/ui-components/controls/ConfirmAction";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardContent } from "@/shared/ui-components/controls/card";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/shared/ui-components/mobile-view/MobileRecordCard";
import {
  useCompanyPlacements,
  useRejectPlacement,
} from "../hooks/useBilling";
import {
  PLACEMENT_STATUS_LABELS,
  type CompanyPlacement,
  type PlacementStatus,
} from "../schemas";

const STATUS_STYLES: Record<PlacementStatus, string> = {
  released: "bg-[#E7F4EC] text-[#17734E]",
  held: "bg-[#FBF3DF] text-[#7A5109]",
  releasing: "bg-primary/15 text-primary",
  disputed: "bg-[#FBEAEA] text-[#9B3535]",
  refunded: "bg-muted text-muted-foreground",
};

const TH = "px-5 py-3 font-semibold";
const HEAD_ROW =
  "border-b border-border bg-muted/40 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground";
const BODY_ROW =
  "border-b border-border/60 transition-colors last:border-0 even:bg-muted/20 hover:bg-accent/50";

/** A placement can be rejected only while its fee is held and its guarantee is
 * still open — the same window the backend enforces. */
function isRejectable(placement: CompanyPlacement): boolean {
  return (
    placement.status === "held" &&
    new Date(placement.holdExpiresAt).getTime() > Date.now()
  );
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
      className={STATUS_STYLES[status] ?? "bg-muted text-muted-foreground"}
    />
  );
}

/** Released placements show when they paid out; held ones when they will. */
const settleLabel = (placement: CompanyPlacement): string =>
  placement.releasedAt
    ? formatDate(placement.releasedAt)
    : formatDate(placement.holdExpiresAt);

function PlacementsEmpty() {
  return (
    <section className="flex flex-col rounded-md border border-border bg-card p-5 shadow-card sm:p-6">
      <h2 className="font-heading text-base font-bold text-navy">
        Placements &amp; Escrow
      </h2>
      <div className="mt-4 flex flex-col items-start gap-3 rounded-md border border-dashed border-input bg-secondary/40 p-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-primary">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-navy">No placements yet</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
            When a candidate accepts your offer, its recruiter fee is held in
            escrow and appears here. It releases to the recruiter 30 days after
            the candidate joins, unless you reject the hire first.
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * The company's escrow view: every placement it is funding, with a "Reject &amp;
 * refund" action on placements still inside their 30-day guarantee. Rejecting
 * returns the held fee to the wallet and reopens the job.
 */
export function CompanyPlacementsPanel() {
  const [page, setPage] = useState(1);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const { data, isPending, isError, refetch } = useCompanyPlacements(page);
  const reject = useRejectPlacement();

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

  if (isPending) return <TableSkeleton />;
  if (data.data.length === 0) return <PlacementsEmpty />;

  const confirming = confirmingId
    ? data.data.find((p) => p.placementId === confirmingId)
    : undefined;

  const onReject = (placementId: string): void => {
    reject.mutate(placementId, {
      onSuccess: () => {
        toast.success("Hire rejected — the held fee was refunded to your wallet.");
        setConfirmingId(null);
      },
      onError: (error) => toast.error(rejectErrorMessage(error)),
    });
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-heading text-base font-bold text-navy">
            Placements &amp; Escrow
          </h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Fees held for your hires. Each releases to the recruiter 30 days
            after the joining date — reject a hire before then to refund it.
          </p>
        </div>

        {confirming ? (
          <div className="border-b border-border p-4">
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

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className={HEAD_ROW}>
                <th scope="col" className={TH}>
                  Candidate
                </th>
                <th scope="col" className={TH}>
                  Role
                </th>
                <th scope="col" className={TH}>
                  Recruiter
                </th>
                <th scope="col" className={cn(TH, "text-right")}>
                  Fee
                </th>
                <th scope="col" className={TH}>
                  Status
                </th>
                <th scope="col" className={TH}>
                  Released / hold ends
                </th>
                <th scope="col" className={cn(TH, "text-right")}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((p) => (
                <tr key={p.placementId} className={BODY_ROW}>
                  <td className="px-5 py-3 font-medium text-navy">
                    {p.candidateName}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    <span className="block max-w-[200px] truncate">
                      {p.jobTitle}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {p.recruiterName}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-medium text-navy">
                    {formatMinor(p.amountMinor)}
                  </td>
                  <td className="px-5 py-3">
                    <PlacementStatusBadge status={p.status} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                    {settleLabel(p)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {isRejectable(p) ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={reject.isPending}
                        onClick={() => setConfirmingId(p.placementId)}
                      >
                        Reject
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
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
                isRejectable(p) ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={reject.isPending}
                    onClick={() => setConfirmingId(p.placementId)}
                  >
                    Reject &amp; refund
                  </Button>
                ) : undefined
              }
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
