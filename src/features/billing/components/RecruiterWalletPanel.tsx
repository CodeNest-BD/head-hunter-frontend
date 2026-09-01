"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Wallet2 } from "lucide-react";

import { PageBanner } from "@/shared/ui-components/brand";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatDate } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardContent } from "@/shared/ui-components/controls/card";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/shared/ui-components/mobile-view/MobileRecordCard";
import {
  useRecruiterPlacements,
  useRecruiterWallet,
} from "../hooks/useBilling";
import {
  PLACEMENT_STATUS_LABELS,
  type PlacementStatus,
  type RecruiterPlacement,
  type RecruiterWalletSummary,
} from "../schemas";

const STATUS_STYLES: Record<PlacementStatus, string> = {
  released: "bg-[#E7F4EC] text-[#17734E]",
  held: "bg-[#FBF3DF] text-[#7A5109]",
  releasing: "bg-primary/15 text-primary",
  disputed: "bg-[#FBEAEA] text-[#9B3535]",
  refunded: "bg-muted text-muted-foreground",
};

/** How a commission moves from a hire to the recruiter's balance. */
const COMMISSION_STEPS: readonly { title: string; detail: string }[] = [
  {
    title: "Candidate hired",
    detail: "The company confirms the placement.",
  },
  {
    title: "30 days in escrow",
    detail: "Commission is held while the hire settles in.",
  },
  {
    title: "Released to balance",
    detail: "Paid out to your payout method.",
  },
];

/** A single balance card: navy for the headline total, white for the rest. */
function BalanceCard({
  label,
  valueMinor,
  hint,
  tone = "white",
}: {
  label: string;
  valueMinor: number | undefined;
  hint: string;
  tone?: "navy" | "white";
}) {
  const navy = tone === "navy";
  return (
    <div
      className={cn(
        "rounded-md p-6 shadow-card",
        navy ? "bg-navy" : "border border-border bg-card",
      )}
    >
      <p
        className={cn(
          "text-[11px] font-semibold uppercase tracking-[0.12em]",
          navy ? "text-white/55" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-heading text-3xl font-extrabold leading-none tabular-nums",
          navy ? "text-white" : "text-navy",
        )}
      >
        {valueMinor === undefined ? "—" : formatMinor(valueMinor)}
      </p>
      <p
        className={cn(
          "mt-2 text-xs",
          navy ? "text-white/60" : "text-muted-foreground",
        )}
      >
        {hint}
      </p>
    </div>
  );
}

function BalanceCards({ data }: { data?: RecruiterWalletSummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <BalanceCard
        label="Total balance"
        valueMinor={data?.totalMinor}
        hint="Everything you've earned so far"
      />
      <BalanceCard
        label="In escrow"
        valueMinor={data?.inEscrowMinor}
        hint={
          data?.nextReleaseAt
            ? `Next release ${formatDate(data.nextReleaseAt)}`
            : "Awaiting the 30-day release"
        }
      />
      <BalanceCard
        label="In dispute"
        valueMinor={data?.inDisputeMinor}
        hint="Held pending a dispute"
      />
    </div>
  );
}

function HowCommissionPaid() {
  return (
    <section className="rounded-md border border-border bg-card p-5 shadow-card sm:p-6">
      <h2 className="font-heading text-base font-bold text-navy">
        How a commission is paid
      </h2>
      <ol className="mt-4 flex flex-col gap-4">
        {COMMISSION_STEPS.map((step, index) => (
          <li key={step.title} className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-primary">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy">{step.title}</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                {step.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function PlacementsEmpty() {
  return (
    <section className="flex flex-col rounded-md border border-border bg-card p-5 shadow-card sm:p-6">
      <h2 className="font-heading text-base font-bold text-navy">Placements</h2>
      <div className="mt-4 flex flex-1 flex-col items-start gap-3 rounded-md border border-dashed border-input bg-secondary/40 p-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-primary">
          <Wallet2 className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-navy">No placements yet</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
            Your commission appears here once a candidate you placed is hired.
          </p>
        </div>
        <Button asChild size="sm" className="mt-1">
          <Link href="/explore-jobs">Browse jobs</Link>
        </Button>
      </div>
    </section>
  );
}

const TH = "px-5 py-3 font-semibold";
const HEAD_ROW =
  "border-b border-border bg-muted/40 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground";
const BODY_ROW =
  "border-b border-border/60 transition-colors last:border-0 even:bg-muted/20 hover:bg-accent/50";

// Status and the release date are rendered by both the desktop table and the
// mobile card.

function PlacementStatusBadge({ status }: { status: PlacementStatus }) {
  return (
    <StatusBadge
      label={PLACEMENT_STATUS_LABELS[status] ?? status}
      className={STATUS_STYLES[status] ?? "bg-muted text-muted-foreground"}
    />
  );
}

/** Released placements show when they paid out; held ones when they will. */
const releaseLabel = (placement: RecruiterPlacement): string =>
  placement.releasedAt
    ? formatDate(placement.releasedAt)
    : formatDate(placement.holdExpiresAt);

function PlacementsTable({
  page,
  onPage,
}: {
  page: number;
  onPage: (page: number) => void;
}) {
  const { data } = useRecruiterPlacements(page);
  if (!data) return null;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-heading text-base font-bold text-navy">
            Placements
          </h2>
        </div>
        <div className="hidden overflow-x-auto sm:block">
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
                    <PlacementStatusBadge status={p.status} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                    {releaseLabel(p)}
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
              subtitle={`${p.companyName} · ${p.jobTitle}`}
              trailing={<PlacementStatusBadge status={p.status} />}
              fields={[
                { label: "Commission", value: formatMinor(p.amountMinor) },
                { label: "Released / hold ends", value: releaseLabel(p) },
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
              onClick={() => onPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= data.meta.totalPages}
              onClick={() => onPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Recruiter earnings: balances, placement history, and how payouts work. */
export function RecruiterWalletPanel() {
  const [page, setPage] = useState(1);
  const wallet = useRecruiterWallet();
  const placements = useRecruiterPlacements(page);

  const hasPlacements = (placements.data?.data.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-6">
      <PageBanner
        title="Wallet"
        subtitle="Commissions paid out, held in escrow, and under dispute."
      />

      {wallet.isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-sm text-destructive">
            <AlertCircle className="h-6 w-6" />
            Could not load your earnings.
            <Button
              variant="outline"
              size="sm"
              onClick={() => void wallet.refetch()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <BalanceCards data={wallet.data} />
      )}

      {placements.isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-sm text-destructive">
            <AlertCircle className="h-6 w-6" />
            Could not load your placements.
            <Button
              variant="outline"
              size="sm"
              onClick={() => void placements.refetch()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : placements.isPending ? (
        <TableSkeleton />
      ) : hasPlacements ? (
        <div className="flex flex-col gap-6">
          <PlacementsTable page={page} onPage={setPage} />
          <HowCommissionPaid />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <PlacementsEmpty />
          <HowCommissionPaid />
        </div>
      )}
    </div>
  );
}
