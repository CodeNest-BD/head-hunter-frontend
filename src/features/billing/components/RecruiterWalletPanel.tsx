"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Wallet2 } from "lucide-react";

import { RaiseDisputeForm } from "@/features/disputes";
import { ENABLE_RECRUITER_PAYOUTS } from "@/shared/config/featureFlags";
import { PageHeader } from "@/shared/ui-components/brand";
import { cn } from "@/shared/libs/shadCnConfig";
import { disputePath } from "@/shared/utils/entityPaths";
import { entriesOf } from "@/shared/utils/entriesOf";
import { formatDate } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import * as T from "@/shared/ui-components/data/tableStyles";
import { TableFilterBar } from "@/shared/ui-components/data/TableFilterBar";
import { Button } from "@/shared/ui-components/controls/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";
import { StatCard } from "@/shared/ui-components/dashboard/DashboardParts";
import { EmptyState } from "@/shared/ui-components/feedback/EmptyState";
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
import {
  useVisibleColumns,
  type ColumnDef,
} from "@/shared/ui-components/data/Columns";
import { PLACEMENT_STATUS_TONES } from "../statusTones";
import { BillingTableFooter } from "./BillingTable";
import { PayoutsCard } from "./PayoutsCard";
import { PayoutsTable } from "./PayoutsTable";

/** Every escrow state, labelled exactly as the row's own pill labels it. */
const PLACEMENT_STATUS_OPTIONS = entriesOf(PLACEMENT_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
);

const PLACEMENT_COLUMNS: ColumnDef[] = [
  { key: "company", label: "Company" },
  { key: "role", label: "Role" },
  // The candidate is the placement, and the trailing cell is where a recruiter
  // opens a dispute — neither can be switched off.
  { key: "candidate", label: "Candidate", required: true },
  { key: "commission", label: "Commission" },
  { key: "status", label: "Status" },
  { key: "released", label: "Released / Hold Ends" },
  { key: "action", label: "Action", required: true },
];

/** The picker's state, owned by the panel so its loading skeleton counts the
 * same columns the table will render. */
type PlacementColumns = ReturnType<typeof useVisibleColumns>;

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
            label: "Available to Withdraw",
            valueMinor: data?.availableMinor,
            hint:
              pendingPayoutMinor > 0
                ? `${formatMinor(pendingPayoutMinor)} already on its way`
                : "Ready to move to your bank",
          },
        ]
      : [
          {
            label: "Total Balance",
            valueMinor: data?.totalMinor,
            hint: "Everything you've earned so far",
          },
        ]),
    {
      label: "In Escrow",
      valueMinor: data?.inEscrowMinor,
      hint: data?.nextReleaseAt
        ? `Next release ${formatDate(data.nextReleaseAt)}`
        : "Awaiting the 30-day release",
    },
    {
      label: "In Dispute",
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
        "grid gap-3",
        ENABLE_RECRUITER_PAYOUTS
          ? "sm:grid-cols-2 lg:grid-cols-4"
          : "sm:grid-cols-3",
      )}
    >
      {cards.map((card) => (
        <StatCard
          key={card.label}
          label={card.label}
          value={
            card.valueMinor === undefined ? "—" : formatMinor(card.valueMinor)
          }
          hint={card.hint}
        />
      ))}
    </div>
  );
}

function HowCommissionPaid() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>How a commission is paid</CardTitle>
      </CardHeader>
      <CardContent>
        {/* `.steps` — the escrow clock explained once, so a row reading
            "In Escrow · Oct 16" needs no further explanation. */}
        <ol className="flex flex-col gap-3">
          {COMMISSION_STEPS.map((step, index) => (
            <li key={step.title} className="flex items-start gap-[11px]">
              <span className="mt-px flex size-[22px] shrink-0 items-center justify-center rounded-full bg-tint text-[11.5px] font-bold text-blue">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-block font-[550] text-ink">{step.title}</p>
                <p className="text-sub text-ink-muted">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function PlacementsEmpty() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Placements</CardTitle>
      </CardHeader>
      <EmptyState
        icon={Wallet2}
        title="No placements yet"
        description="Your commission appears here once a candidate you placed is hired."
        action={
          <Button asChild size="sm">
            <Link href="/explore-jobs">Browse jobs</Link>
          </Button>
        }
      />
    </Card>
  );
}

// Status and the release date are rendered by both the desktop table and the
// mobile card.

function PlacementStatusBadge({ status }: { status: PlacementStatus }) {
  return (
    <StatusBadge
      label={PLACEMENT_STATUS_LABELS[status] ?? status}
      tone={PLACEMENT_STATUS_TONES[status] ?? "neutral"}
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
  cols,
  status,
  onStatus,
  data,
}: {
  page: number;
  onPage: (page: number) => void;
  cols: PlacementColumns;
  status: string | null;
  onStatus: (next: string | null) => void;
  /** The panel owns the query, so the two do not fetch the same page twice. */
  data: ReturnType<typeof useRecruiterPlacements>["data"];
}) {
  const router = useRouter();
  const [disputingId, setDisputingId] = useState<string | null>(null);
  // Only reachable between pages, where the table is already on screen — stand
  // in with the same card rather than collapsing the page to nothing.
  if (!data) {
    return (
      <TableSkeleton columns={cols.allKeys.filter(cols.isVisible).length} />
    );
  }

  const disputing = disputingId
    ? data.data.find((p) => p.placementId === disputingId)
    : undefined;

  return (
    <div className={T.TABLE_CARD}>
      <CardHeader>
        <CardTitle>Placements</CardTitle>
      </CardHeader>
      <TableFilterBar
        surface="card"
        filters={[
          {
            kind: "select",
            key: "status",
            label: "Status",
            placeholder: "All statuses",
            options: PLACEMENT_STATUS_OPTIONS,
            value: status ?? "",
            onChange: (next) => onStatus(next === "" ? null : next),
            width: "180px",
          },
        ]}
        columns={cols.columns}
        isColumnVisible={cols.isVisible}
        onToggleColumn={cols.toggle}
        onClearFilters={() => onStatus(null)}
      />
      {disputing ? (
        <div className="border-b border-line p-4">
          <RaiseDisputeForm
            placementId={disputing.placementId}
            party="recruiter"
            onCancel={() => setDisputingId(null)}
            onRaised={(dispute) => {
              setDisputingId(null);
              router.push(disputePath(dispute));
            }}
          />
        </div>
      ) : null}
      <div className={cn("hidden sm:block", T.TABLE_SCROLL)}>
        <table className={T.TABLE_EL}>
          <thead className={T.TABLE_HEAD}>
            <tr>
              {cols.isVisible("company") && (
                <th scope="col" className={cn(T.TABLE_TH, "w-[22%]")}>
                  Company
                </th>
              )}
              {cols.isVisible("role") && (
                <th scope="col" className={T.TABLE_TH}>
                  Role
                </th>
              )}
              <th scope="col" className={T.TABLE_TH}>
                Candidate
              </th>
              {cols.isVisible("commission") && (
                <th scope="col" className={cn(T.TABLE_TH, "text-right")}>
                  Commission
                </th>
              )}
              {cols.isVisible("status") && (
                <th scope="col" className={T.TABLE_TH}>
                  Status
                </th>
              )}
              {cols.isVisible("released") && (
                <th scope="col" className={T.TABLE_TH}>
                  Released / Hold Ends
                </th>
              )}
              <th scope="col" className={cn(T.TABLE_TH, "w-[110px]")} />
            </tr>
          </thead>
          <tbody className={T.TABLE_BODY}>
            {data.data.map((p) => (
              <tr key={p.placementId} className={T.TABLE_ROW}>
                {cols.isVisible("company") && (
                  <td className={cn(T.TABLE_TD, T.TABLE_CELL_MAIN)}>
                    {p.companyName}
                  </td>
                )}
                {cols.isVisible("role") && (
                  <td className={cn(T.TABLE_TD, "text-ink-body")}>
                    <span className="block max-w-[200px] truncate">
                      {p.jobTitle}
                    </span>
                  </td>
                )}
                <td className={cn(T.TABLE_TD, "text-ink-body")}>
                  {p.candidateName}
                </td>
                {cols.isVisible("commission") && (
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
                {cols.isVisible("released") && (
                  <td
                    className={cn(
                      T.TABLE_TD,
                      "whitespace-nowrap tabular-nums text-ink-body",
                    )}
                  >
                    {releaseLabel(p)}
                  </td>
                )}
                <td className={cn(T.TABLE_TD, "text-right")}>
                  {p.status === "held" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDisputingId(p.placementId)}
                    >
                      Dispute
                    </Button>
                  ) : p.status === "disputed" ? (
                    <span className="text-meta text-ink-faint">In dispute</span>
                  ) : (
                    <span className="text-meta text-ink-faint">—</span>
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
              { label: "Released / Hold Ends", value: releaseLabel(p) },
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
      <CardFooter>
        <BillingTableFooter
          total={data.meta.total}
          page={page}
          totalPages={data.meta.totalPages}
          onPage={onPage}
          className="w-full"
        />
      </CardFooter>
    </div>
  );
}

/** Recruiter earnings: balances, placement history, and how payouts work. */
export function RecruiterWalletPanel() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | null>(null);
  const wallet = useRecruiterWallet();
  const placements = useRecruiterPlacements(page, status ?? undefined);
  const cols = useVisibleColumns(
    "recruiter.placements.columns",
    PLACEMENT_COLUMNS,
  );
  const changeStatus = (next: string | null) => {
    setStatus(next);
    setPage(1);
  };

  // A filtered list that matches nothing is not the same as having no
  // placements — the first needs a way back, the second an explanation.
  const rows = placements.data?.data ?? [];
  const hasPlacements = rows.length > 0 || status !== null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Wallet"
        subtitle="Commissions paid out, held in escrow, and under dispute."
      />

      {wallet.isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-sub text-bad">
            <AlertCircle className="size-[17px]" />
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
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-sub text-bad">
            <AlertCircle className="size-[17px]" />
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
        /* Match whatever columns this reader has left switched on. */
        <TableSkeleton columns={cols.allKeys.filter(cols.isVisible).length} />
      ) : hasPlacements ? (
        <div className="flex flex-col gap-4">
          <PlacementsTable
            page={page}
            onPage={setPage}
            cols={cols}
            status={status}
            onStatus={changeStatus}
            data={placements.data}
          />
          <HowCommissionPaid />
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          <PlacementsEmpty />
          <HowCommissionPaid />
        </div>
      )}
    </div>
  );
}
