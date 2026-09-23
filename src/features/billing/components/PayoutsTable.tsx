"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { formatDate } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardContent } from "@/shared/ui-components/controls/card";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/shared/ui-components/mobile-view/MobileRecordCard";
import { usePayouts } from "../hooks/useBilling";
import {
  PAYOUT_STATUS_LABELS,
  type Payout,
  type PayoutStatus,
} from "../schemas";
import { BODY_ROW, BillingTableFooter, HEAD_ROW, TH } from "./billingTable";

const STATUS_STYLES: Record<PayoutStatus, string> = {
  pending: "bg-[#FBF3DF] text-[#7A5109]",
  processing: "bg-primary/15 text-primary",
  paid: "bg-[#E7F4EC] text-[#17734E]",
  failed: "bg-[#FBEAEA] text-[#9B3535]",
  canceled: "bg-muted text-muted-foreground",
};

function PayoutStatusBadge({ status }: { status: PayoutStatus }) {
  return (
    <StatusBadge
      label={PAYOUT_STATUS_LABELS[status] ?? status}
      className={STATUS_STYLES[status] ?? "bg-muted text-muted-foreground"}
    />
  );
}

/** One line of context per status — exhaustive so no state shows stale copy. */
function payoutDetail(payout: Payout): string {
  switch (payout.status) {
    case "pending":
    case "processing":
      return "Arrives in 2–3 business days";
    case "paid":
      return payout.paidAt ? `Paid ${formatDate(payout.paidAt)}` : "Paid";
    case "failed":
      return payout.failureReason ?? "Returned by the bank — balance restored.";
    case "canceled":
      return "Canceled — balance restored.";
  }
}

/**
 * Withdrawal history. Renders nothing until the first withdrawal exists, so
 * recruiters who haven't set up payouts don't see an empty shell — but a fetch
 * failure surfaces as an error card rather than silently vanishing history.
 */
export function PayoutsTable() {
  const [page, setPage] = useState(1);
  const payouts = usePayouts(page);

  if (payouts.isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-sm text-destructive">
          <AlertCircle className="h-6 w-6" />
          Could not load your withdrawals.
          <Button
            variant="outline"
            size="sm"
            onClick={() => void payouts.refetch()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const data = payouts.data;
  if (!data || (data.meta.total === 0 && page === 1)) return null;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-heading text-base font-bold text-navy">
            Withdrawals
          </h2>
        </div>
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className={HEAD_ROW}>
                <th scope="col" className={TH}>
                  Requested
                </th>
                <th scope="col" className={cn(TH, "text-right")}>
                  Amount
                </th>
                <th scope="col" className={TH}>
                  Status
                </th>
                <th scope="col" className={TH}>
                  Detail
                </th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((payout) => (
                <tr key={payout.id} className={BODY_ROW}>
                  <td className="whitespace-nowrap px-5 py-3 text-navy">
                    {formatDate(payout.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-medium text-navy">
                    {formatMinor(payout.amountMinor)}
                  </td>
                  <td className="px-5 py-3">
                    <PayoutStatusBadge status={payout.status} />
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {payoutDetail(payout)}
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
            />
          ))}
        </MobileRecordList>
        <BillingTableFooter
          total={data.meta.total}
          page={page}
          totalPages={data.meta.totalPages}
          onPage={setPage}
        />
      </CardContent>
    </Card>
  );
}
