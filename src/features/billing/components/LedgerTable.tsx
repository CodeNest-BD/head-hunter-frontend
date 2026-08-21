"use client";

import { useState } from "react";
import { Receipt } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { formatDateTime } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardContent } from "@/shared/ui-components/controls/card";
import { useLedger } from "../hooks/useBilling";
import { LEDGER_TYPE_LABELS, type LedgerEntry } from "../schemas";

/** Credits grow the spendable pot; reserves/holds shrink it. */
const isInflow = (type: LedgerEntry["entryType"]): boolean =>
  type === "credit" || type === "release_reserve" || type === "refund";

/** The wallet's append-only history, newest first. */
export function LedgerTable() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useLedger(page);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Loading history…
        </CardContent>
      </Card>
    );
  }

  const entries = data?.data ?? [];
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
            <Receipt className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-navy">No activity yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Load funds and your top-ups, reservations and refunds will show up
              here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                <th className="px-5 py-3 font-semibold">When</th>
                <th className="px-5 py-3 font-semibold">Activity</th>
                <th className="px-5 py-3 text-right font-semibold">Amount</th>
                <th className="px-5 py-3 text-right font-semibold">Balance</th>
                <th className="px-5 py-3 text-right font-semibold">Reserved</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                    {formatDateTime(entry.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-navy">
                      {LEDGER_TYPE_LABELS[entry.entryType]}
                    </p>
                    {entry.description && (
                      <p className="text-xs text-muted-foreground">
                        {entry.description}
                      </p>
                    )}
                  </td>
                  <td
                    className={cn(
                      "whitespace-nowrap px-5 py-3 text-right font-semibold",
                      isInflow(entry.entryType)
                        ? "text-[#17734E]"
                        : "text-navy",
                    )}
                  >
                    {isInflow(entry.entryType) ? "+" : "−"}
                    {formatMinor(entry.amountMinor)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right text-muted-foreground">
                    {formatMinor(entry.balanceAfterMinor)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right text-muted-foreground">
                    {formatMinor(entry.reservedAfterMinor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
            <span className="text-muted-foreground">
              Page {page} of {totalPages}
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
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
