"use client";

import { useState } from "react";
import { FileText, Receipt } from "lucide-react";

import { useAuth } from "@/features/auth";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatDateTime } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import { Card } from "@/shared/ui-components/controls/card";
import { EmptyState } from "@/shared/ui-components/feedback/EmptyState";
import * as T from "@/shared/ui-components/data/tableStyles";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/shared/ui-components/mobile-view/MobileRecordCard";
import {
  ColumnFilter,
  FilterableHead,
} from "@/shared/ui-components/data/ColumnFilter";
import { useLedger } from "../hooks/useBilling";

/** Each kind of wallet movement, labelled as the Activity cell labels it. */
const LEDGER_TYPE_OPTIONS = (
  Object.entries(LEDGER_TYPE_LABELS) as [LedgerEntry["entryType"], string][]
).map(([value, label]) => ({ value, label }));
import { LEDGER_TYPE_LABELS, type LedgerEntry } from "../schemas";
import { PurchaseReceiptDialog } from "./PurchaseReceiptDialog";

/** Credits grow the spendable pot; reserves/holds shrink it. */
const isInflow = (type: LedgerEntry["entryType"]): boolean =>
  type === "credit" || type === "release_reserve" || type === "refund";

/** A purchase — a top-up the company paid for — gets a downloadable receipt. */
const isPurchase = (type: LedgerEntry["entryType"]): boolean =>
  type === "credit";

// Amount and Document are rendered by both the desktop table and the mobile
// card, so their shape lives here rather than inline in either one.

/** Money into the wallet reads green; money leaving it stays in ink. */
const amountToneClass = (entry: LedgerEntry): string =>
  isInflow(entry.entryType) ? "text-ok" : "text-ink";

const amountLabel = (entry: LedgerEntry): string =>
  `${isInflow(entry.entryType) ? "+" : "−"}${formatMinor(entry.amountMinor)}`;

function LedgerDocument({
  entry,
  accountName,
}: {
  entry: LedgerEntry;
  accountName: string;
}) {
  return isPurchase(entry.entryType) ? (
    <PurchaseReceiptDialog entry={entry} accountName={accountName}>
      <Button type="button" variant="outline" size="sm">
        <FileText />
        Receipt
      </Button>
    </PurchaseReceiptDialog>
  ) : (
    <span className="text-ink-faint">—</span>
  );
}

/** The wallet's append-only history, newest first. */
export function LedgerTable() {
  const [page, setPage] = useState(1);
  const [entryType, setEntryType] = useState<string | null>(null);
  const { data, isLoading } = useLedger(page, entryType ?? undefined);
  const changeEntryType = (next: string | null) => {
    setEntryType(next);
    setPage(1);
  };
  const { user } = useAuth();
  const accountName = user ? `${user.firstName} ${user.lastName}`.trim() : "";

  if (isLoading) {
    // When · Activity · Amount · Balance · Reserved · Document.
    return <TableSkeleton rows={6} columns={6} />;
  }

  const entries = data?.data ?? [];
  if (entries.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Receipt}
          title="No activity yet"
          description="Load funds and your top-ups, reservations and refunds will show up here."
        />
      </Card>
    );
  }

  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <div className={T.TABLE_CARD}>
      <div className={cn("hidden sm:block", T.TABLE_SCROLL)}>
        <table className={T.TABLE_EL}>
          <thead className={T.TABLE_HEAD}>
            <tr>
              <th scope="col" className={T.TABLE_TH}>
                When
              </th>
              <FilterableHead label="Activity" className="w-2/5">
                <ColumnFilter
                  label="Activity"
                  options={LEDGER_TYPE_OPTIONS}
                  value={entryType}
                  onChange={changeEntryType}
                />
              </FilterableHead>
              <th scope="col" className={cn(T.TABLE_TH, "text-right")}>
                Amount
              </th>
              <th scope="col" className={cn(T.TABLE_TH, "text-right")}>
                Balance
              </th>
              <th scope="col" className={cn(T.TABLE_TH, "text-right")}>
                Reserved
              </th>
              <th scope="col" className={cn(T.TABLE_TH, "text-right")}>
                Document
              </th>
            </tr>
          </thead>
          <tbody className={T.TABLE_BODY}>
            {entries.map((entry) => (
              <tr key={entry.id} className={T.TABLE_ROW}>
                <td
                  className={cn(
                    T.TABLE_TD,
                    "whitespace-nowrap tabular-nums text-ink-body",
                  )}
                >
                  {formatDateTime(entry.createdAt)}
                </td>
                <td className={T.TABLE_TD_STACKED}>
                  <p className={T.TABLE_CELL_MAIN}>
                    {LEDGER_TYPE_LABELS[entry.entryType]}
                  </p>
                  {entry.description && (
                    <p className={T.TABLE_CELL_SUB}>{entry.description}</p>
                  )}
                </td>
                <td
                  className={cn(
                    T.TABLE_TD,
                    "whitespace-nowrap text-right font-[650] tabular-nums",
                    amountToneClass(entry),
                  )}
                >
                  {amountLabel(entry)}
                </td>
                <td
                  className={cn(
                    T.TABLE_TD,
                    "whitespace-nowrap text-right tabular-nums text-ink-muted",
                  )}
                >
                  {formatMinor(entry.balanceAfterMinor)}
                </td>
                <td
                  className={cn(
                    T.TABLE_TD,
                    "whitespace-nowrap text-right tabular-nums text-ink-muted",
                  )}
                >
                  {formatMinor(entry.reservedAfterMinor)}
                </td>
                <td className={cn(T.TABLE_TD, "whitespace-nowrap text-right")}>
                  <LedgerDocument entry={entry} accountName={accountName} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <MobileRecordList className="sm:hidden">
        {entries.map((entry) => (
          <MobileRecordCard
            key={entry.id}
            title={LEDGER_TYPE_LABELS[entry.entryType]}
            subtitle={entry.description}
            trailing={
              <span
                className={cn(
                  "whitespace-nowrap text-sub font-[650] tabular-nums",
                  amountToneClass(entry),
                )}
              >
                {amountLabel(entry)}
              </span>
            }
            fields={[
              { label: "When", value: formatDateTime(entry.createdAt) },
              {
                label: "Balance",
                value: formatMinor(entry.balanceAfterMinor),
              },
              {
                label: "Reserved",
                value: formatMinor(entry.reservedAfterMinor),
              },
              {
                label: "Document",
                value: (
                  <LedgerDocument entry={entry} accountName={accountName} />
                ),
              },
            ]}
          />
        ))}
      </MobileRecordList>
      {totalPages > 1 && (
        <div className="flex flex-col gap-2 border-t border-line px-3.5 py-2.5 text-[12.5px] text-ink-muted sm:flex-row sm:items-center">
          <span className="tabular-nums">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1 sm:ml-auto">
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
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
