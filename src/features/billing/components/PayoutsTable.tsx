"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { entriesOf } from "@/shared/utils/entriesOf";
import { formatDate } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import {
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";
import {
  useVisibleColumns,
  type ColumnDef,
} from "@/shared/ui-components/data/Columns";
import * as T from "@/shared/ui-components/data/tableStyles";
import { TableFilterBar } from "@/shared/ui-components/data/TableFilterBar";
import { ErrorRetryCallout } from "@/shared/ui-components/feedback/ErrorRetryCallout";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/shared/ui-components/mobile-view/MobileRecordCard";
import { usePayouts } from "../hooks/useBilling";
import { payoutDetail } from "../payoutTracking";
import { PAYOUT_STATUS_LABELS, type Payout } from "../schemas";
import { BillingTableFooter } from "./BillingTable";
import {
  PayoutStatusBadge,
  PayoutTrackingDialog,
} from "./PayoutTrackingDialog";

const COLUMNS: ColumnDef[] = [
  // A withdrawal is its amount, and the trailing cell is the keyboard and
  // screen-reader way into the tracking timeline — both stay.
  { key: "requested", label: "Requested" },
  { key: "amount", label: "Amount", required: true },
  { key: "status", label: "Status" },
  { key: "detail", label: "Detail" },
  { key: "track", label: "Track", required: true },
];

/**
 * Withdrawal history. Renders nothing until the first withdrawal exists, so
 * recruiters who haven't set up payouts don't see an empty shell — but a fetch
 * failure surfaces as an error card rather than silently vanishing history.
 * Every row opens its tracking timeline.
 */
/** Each state, labelled exactly as the row's own pill labels it. */
const PAYOUT_STATUS_OPTIONS = entriesOf(PAYOUT_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export function PayoutsTable() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Payout | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const payouts = usePayouts(page, status ?? undefined);
  const cols = useVisibleColumns("recruiter.payouts.columns", COLUMNS);
  const changeStatus = (next: string | null) => {
    setStatus(next);
    setPage(1);
  };

  if (payouts.isError) {
    return (
      <ErrorRetryCallout
        message="Could not load your withdrawals."
        onRetry={() => void payouts.refetch()}
      />
    );
  }

  const data = payouts.data;
  // A recruiter with no withdrawals at all gets nothing — but one whose filter
  // matched nothing keeps the card, so the filter bar stays on screen to be
  // cleared.
  if (!data || (data.meta.total === 0 && page === 1 && status === null)) {
    return null;
  }

  return (
    <div className={T.TABLE_CARD}>
      <CardHeader>
        <CardTitle>Withdrawals</CardTitle>
      </CardHeader>
      <TableFilterBar
        surface="card"
        filters={[
          {
            kind: "select",
            key: "status",
            label: "Status",
            placeholder: "All statuses",
            options: PAYOUT_STATUS_OPTIONS,
            value: status ?? "",
            onChange: (next) => changeStatus(next === "" ? null : next),
          },
        ]}
        columns={cols.columns}
        isColumnVisible={cols.isVisible}
        onToggleColumn={cols.toggle}
        onClearFilters={() => changeStatus(null)}
      />
      <div className={cn("hidden sm:block", T.TABLE_SCROLL)}>
        <table className={T.TABLE_EL}>
          <thead className={T.TABLE_HEAD}>
            <tr>
              {cols.isVisible("requested") && (
                <th scope="col" className={T.TABLE_TH}>
                  Requested
                </th>
              )}
              <th scope="col" className={cn(T.TABLE_TH, "text-right")}>
                Amount
              </th>
              {cols.isVisible("status") && (
                <th scope="col" className={T.TABLE_TH}>
                  Status
                </th>
              )}
              {cols.isVisible("detail") && (
                <th scope="col" className={T.TABLE_TH}>
                  Detail
                </th>
              )}
              <th scope="col" className={cn(T.TABLE_TH, "w-11")}>
                <span className="sr-only">Track</span>
              </th>
            </tr>
          </thead>
          <tbody className={T.TABLE_BODY}>
            {data.data.map((payout) => (
              <tr
                key={payout.id}
                className={cn(T.TABLE_ROW, "cursor-pointer")}
                onClick={() => setSelected(payout)}
              >
                {cols.isVisible("requested") && (
                  <td
                    className={cn(
                      T.TABLE_TD,
                      "whitespace-nowrap tabular-nums text-ink-body",
                    )}
                  >
                    {formatDate(payout.createdAt)}
                  </td>
                )}
                <td
                  className={cn(
                    T.TABLE_TD,
                    "whitespace-nowrap text-right font-[650] tabular-nums text-ink",
                  )}
                >
                  {formatMinor(payout.amountMinor)}
                </td>
                {cols.isVisible("status") && (
                  <td className={T.TABLE_TD}>
                    <PayoutStatusBadge status={payout.status} />
                  </td>
                )}
                {cols.isVisible("detail") && (
                  <td className={cn(T.TABLE_TD, "text-ink-body")}>
                    {payoutDetail(payout)}
                  </td>
                )}
                <td className={cn(T.TABLE_TD, "text-right")}>
                  <button
                    type="button"
                    aria-label={`Track withdrawal of ${formatMinor(payout.amountMinor)}`}
                    className="inline-flex size-7 items-center justify-center rounded-xs text-ink-faint transition-colors hover:bg-surface-sunken hover:text-ink"
                    onClick={(event) => {
                      // The row click already opens the dialog; keep the
                      // button as the keyboard/screen-reader entry point.
                      event.stopPropagation();
                      setSelected(payout);
                    }}
                  >
                    <ChevronRight className="size-[15px]" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <MobileRecordList className="sm:hidden">
        {data.data.map((payout) => (
          <MobileRecordCard
            key={payout.id}
            title={formatMinor(payout.amountMinor)}
            subtitle={payoutDetail(payout)}
            trailing={<PayoutStatusBadge status={payout.status} />}
            fields={[
              { label: "Requested", value: formatDate(payout.createdAt) },
            ]}
            actions={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelected(payout)}
              >
                Track
              </Button>
            }
          />
        ))}
      </MobileRecordList>
      <CardFooter>
        <BillingTableFooter
          total={data.meta.total}
          page={page}
          totalPages={data.meta.totalPages}
          onPage={setPage}
          className="w-full"
        />
      </CardFooter>
      <PayoutTrackingDialog
        payout={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
