"use client";

import { useState } from "react";
import { FileText, Receipt } from "lucide-react";

import { useAuth } from "@/features/auth";
import { cn } from "@/shared/libs/shadCnConfig";
import { entriesOf } from "@/shared/utils/entriesOf";
import { formatDateTime } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardFooter } from "@/shared/ui-components/controls/card";
import { EmptyState } from "@/shared/ui-components/feedback/EmptyState";
import * as T from "@/shared/ui-components/data/tableStyles";
import { TableFilterBar } from "@/shared/ui-components/data/TableFilterBar";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/shared/ui-components/mobile-view/MobileRecordCard";
import {
  useVisibleColumns,
  type ColumnDef,
} from "@/shared/ui-components/data/Columns";
import { useLedger } from "../hooks/useBilling";
import { BillingTableFooter } from "./BillingTable";
import { LEDGER_TYPE_LABELS, type LedgerEntry } from "../schemas";
import { PurchaseReceiptDialog } from "./PurchaseReceiptDialog";

/** Each kind of wallet movement, labelled as the Activity cell labels it. */
const LEDGER_TYPE_OPTIONS = entriesOf(LEDGER_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

const COLUMNS: ColumnDef[] = [
  // When it happened and what it was are what a history row is; the running
  // figures and the receipt beside them are the reader's to choose.
  { key: "when", label: "When", required: true },
  { key: "activity", label: "Activity", required: true },
  { key: "amount", label: "Amount" },
  { key: "balance", label: "Balance" },
  { key: "reserved", label: "Reserved" },
  { key: "document", label: "Document" },
];

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
  const cols = useVisibleColumns("company.ledger.columns", COLUMNS);

  const filterBar = (
    <TableFilterBar
      surface="card"
      filters={[
        {
          kind: "select",
          key: "activity",
          label: "Activity",
          placeholder: "All activity",
          options: LEDGER_TYPE_OPTIONS,
          value: entryType ?? "",
          onChange: (next) => changeEntryType(next === "" ? null : next),
          width: "200px",
        },
      ]}
      columns={cols.columns}
      isColumnVisible={cols.isVisible}
      onToggleColumn={cols.toggle}
      onClearFilters={() => changeEntryType(null)}
    />
  );

  if (isLoading) {
    return (
      <Card>
        {filterBar}
        {/* Match whatever columns this reader has left switched on. */}
        <TableSkeleton
          rows={6}
          columns={cols.allKeys.filter(cols.isVisible).length}
          className="rounded-none border-0 shadow-none"
        />
      </Card>
    );
  }

  const entries = data?.data ?? [];
  if (entries.length === 0) {
    return (
      <Card>
        {filterBar}
        <EmptyState
          icon={Receipt}
          title="No activity yet"
          description="Load funds and your top-ups, reservations and refunds will show up here."
          action={
            entryType !== null ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => changeEntryType(null)}
              >
                Reset filters
              </Button>
            ) : undefined
          }
        />
      </Card>
    );
  }

  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <div className={T.TABLE_CARD}>
      {filterBar}
      <div className={cn("hidden sm:block", T.TABLE_SCROLL)}>
        <table className={T.TABLE_EL}>
          <thead className={T.TABLE_HEAD}>
            <tr>
              <th scope="col" className={T.TABLE_TH}>
                When
              </th>
              <th scope="col" className={cn(T.TABLE_TH, "w-2/5")}>
                Activity
              </th>
              {cols.isVisible("amount") && (
                <th scope="col" className={cn(T.TABLE_TH, "text-right")}>
                  Amount
                </th>
              )}
              {cols.isVisible("balance") && (
                <th scope="col" className={cn(T.TABLE_TH, "text-right")}>
                  Balance
                </th>
              )}
              {cols.isVisible("reserved") && (
                <th scope="col" className={cn(T.TABLE_TH, "text-right")}>
                  Reserved
                </th>
              )}
              {cols.isVisible("document") && (
                <th scope="col" className={cn(T.TABLE_TH, "text-right")}>
                  Document
                </th>
              )}
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
                {cols.isVisible("amount") && (
                  <td
                    className={cn(
                      T.TABLE_TD,
                      "whitespace-nowrap text-right font-[650] tabular-nums",
                      amountToneClass(entry),
                    )}
                  >
                    {amountLabel(entry)}
                  </td>
                )}
                {cols.isVisible("balance") && (
                  <td
                    className={cn(
                      T.TABLE_TD,
                      "whitespace-nowrap text-right tabular-nums text-ink-muted",
                    )}
                  >
                    {formatMinor(entry.balanceAfterMinor)}
                  </td>
                )}
                {cols.isVisible("reserved") && (
                  <td
                    className={cn(
                      T.TABLE_TD,
                      "whitespace-nowrap text-right tabular-nums text-ink-muted",
                    )}
                  >
                    {formatMinor(entry.reservedAfterMinor)}
                  </td>
                )}
                {cols.isVisible("document") && (
                  <td
                    className={cn(T.TABLE_TD, "whitespace-nowrap text-right")}
                  >
                    <LedgerDocument entry={entry} accountName={accountName} />
                  </td>
                )}
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
      <CardFooter>
        <BillingTableFooter
          total={data?.meta.total ?? 0}
          page={page}
          totalPages={totalPages}
          onPage={setPage}
          className="w-full"
        />
      </CardFooter>
    </div>
  );
}
