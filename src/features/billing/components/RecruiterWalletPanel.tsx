"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Wallet2 } from "lucide-react";

import { RaiseDisputeForm } from "@/features/disputes";
import { ENABLE_RECRUITER_PAYOUTS } from "@/shared/config/featureFlags";
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
import { useBillingRefreshBurst } from "../hooks/useBillingRefreshBurst";
import {
  PLACEMENT_STATUS_LABELS,
  type PlacementStatus,
  type RecruiterPlacement,
  type RecruiterWalletSummary,
} from "../schemas";
import { BODY_ROW, BillingTableFooter, HEAD_ROW, TH } from "./billingTable";
import { CheckoutResultBanner } from "./CheckoutResultBanner";
import { PayoutsCard } from "./PayoutsCard";
import { PayoutsTable } from "./PayoutsTable";

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
    detail: ENABLE_RECRUITER_PAYOUTS
      ? "The commission lands in your balance, ready to withdraw."
      : "Paid out to your payout method.",
  },
  ...(ENABLE_RECRUITER_PAYOUTS
    ? [
        {
          title: "Withdraw to your bank",
          detail:
            "Move your balance to your bank account — it arrives in 2–3 business days.",
        },
      ]
    : []),
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
  const pendingPayoutMinor = data?.pendingPayoutMinor ?? 0;

  // One card list, so the shared escrow/dispute cards exist exactly once —
  // only the head and tail of the strip change with the payout flag.
  const cards: readonly {
    label: string;
    valueMinor: number | undefined;
    hint: string;
  }[] = [
    ...(ENABLE_RECRUITER_PAYOUTS
      ? [
          {
            label: "Available to withdraw",
            valueMinor: data?.availableMinor,
            hint:
              pendingPayoutMinor > 0
                ? `${formatMinor(pendingPayoutMinor)} already on its way`
                : "Ready to move to your bank",
          },
        ]
      : [
          {
            label: "Total balance",
            valueMinor: data?.totalMinor,
            hint: "Everything you've earned so far",
          },
        ]),
    {
      label: "In escrow",
      valueMinor: data?.inEscrowMinor,
      hint: data?.nextReleaseAt
        ? `Next release ${formatDate(data.nextReleaseAt)}`
        : "Awaiting the 30-day release",
    },
    {
      label: "In dispute",
      valueMinor: data?.inDisputeMinor,
      hint: "Held pending a dispute",
    },
    ...(ENABLE_RECRUITER_PAYOUTS
      ? [
          {
            label: "Earned YTD",
            valueMinor: data?.earnedYtdMinor,
            hint: "Released to you this calendar year",
          },
        ]
      : []),
  ];

  return (
    <div
      className={cn(
        "grid gap-4",
        ENABLE_RECRUITER_PAYOUTS
          ? "sm:grid-cols-2 lg:grid-cols-4"
          : "sm:grid-cols-3",
      )}
    >
      {cards.map((card) => (
        <BalanceCard key={card.label} {...card} />
      ))}
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
  const router = useRouter();
  const [disputingId, setDisputingId] = useState<string | null>(null);
  const { data } = useRecruiterPlacements(page);
  if (!data) return null;

  const disputing = disputingId
    ? data.data.find((p) => p.placementId === disputingId)
    : undefined;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-heading text-base font-bold text-navy">
            Placements
          </h2>
        </div>
        {disputing ? (
          <div className="border-b border-border p-4">
            <RaiseDisputeForm
              placementId={disputing.placementId}
              onCancel={() => setDisputingId(null)}
              onRaised={(id) => {
                setDisputingId(null);
                router.push(`/disputes/${id}`);
              }}
            />
          </div>
        ) : null}
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
                <th scope="col" className={TH} />
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
                  <td className="px-5 py-3 text-right">
                    {p.status === "held" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDisputingId(p.placementId)}
                      >
                        Dispute
                      </Button>
                    ) : p.status === "disputed" ? (
                      <span className="text-xs text-muted-foreground">
                        In dispute
                      </span>
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
              subtitle={`${p.companyName} · ${p.jobTitle}`}
              trailing={<PlacementStatusBadge status={p.status} />}
              fields={[
                { label: "Commission", value: formatMinor(p.amountMinor) },
                { label: "Released / hold ends", value: releaseLabel(p) },
              ]}
              actions={
                p.status === "held" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setDisputingId(p.placementId)}
                  >
                    Open a dispute
                  </Button>
                ) : undefined
              }
            />
          ))}
        </MobileRecordList>
        <BillingTableFooter
          total={data.meta.total}
          page={page}
          totalPages={data.meta.totalPages}
          onPage={onPage}
        />
      </CardContent>
    </Card>
  );
}

/** Recruiter earnings: balances, placement history, and how payouts work. */
export function RecruiterWalletPanel() {
  const [page, setPage] = useState(1);
  const wallet = useRecruiterWallet();
  const placements = useRecruiterPlacements(page);
  // Returning from Stripe Connect onboarding with `?connect=success` races the
  // `account.updated` webhook, so burst-refresh the billing queries.
  const refresh = useBillingRefreshBurst();

  const hasPlacements = (placements.data?.data.length ?? 0) > 0;

  const startRefresh = refresh.start;
  const onConnectResult = useCallback(
    (result: "success" | "canceled") => {
      if (result === "success") startRefresh();
    },
    [startRefresh],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageBanner
        title="Wallet"
        subtitle="Commissions paid out, held in escrow, and under dispute."
      />

      {ENABLE_RECRUITER_PAYOUTS ? (
        <CheckoutResultBanner
          param="connect"
          successMessage="Bank details saved — withdrawing unlocks as soon as Stripe finishes verifying."
          cancelMessage="Payout setup canceled. You can pick it up again anytime."
          onResult={onConnectResult}
        />
      ) : null}

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

      {ENABLE_RECRUITER_PAYOUTS ? (
        <>
          <PayoutsCard wallet={wallet.data} />
          <PayoutsTable />
        </>
      ) : null}

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
