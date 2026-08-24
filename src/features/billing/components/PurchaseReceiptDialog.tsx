"use client";

import { useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { jsPDF } from "jspdf";
import { Download, X } from "lucide-react";

import { Button } from "@/shared/ui-components/controls/button";
import { formatDateTime } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { LEDGER_TYPE_LABELS, type LedgerEntry } from "../schemas";

interface PurchaseReceiptDialogProps {
  entry: LedgerEntry;
  /** The account the receipt is billed to (the signed-in user's name). */
  accountName: string;
  /** The element that opens the receipt. */
  children: ReactNode;
}

const BRAND = "Head-Hunters.com";

/** A short, human-friendly receipt number derived from the ledger id. */
function receiptNumber(id: string): string {
  return id.replace(/-/g, "").slice(0, 10).toUpperCase();
}

function lineItemLabel(entry: LedgerEntry): string {
  return entry.description ?? LEDGER_TYPE_LABELS[entry.entryType];
}

/** Builds and saves a standalone PDF receipt for the transaction. */
function downloadReceiptPdf(entry: LedgerEntry, accountName: string): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 56;
  const amount = formatMinor(entry.amountMinor);
  const number = receiptNumber(entry.id);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(10, 23, 56);
  doc.text(BRAND, marginX, 72);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(120, 128, 145);
  doc.text("Payment receipt", marginX, 92);

  // Meta block, right-aligned.
  const rightX = 540;
  doc.setFontSize(10);
  doc.text(`Receipt #${number}`, rightX, 72, { align: "right" });
  doc.text(formatDateTime(entry.createdAt), rightX, 88, { align: "right" });

  doc.setDrawColor(224, 232, 243);
  doc.line(marginX, 116, rightX, 116);

  doc.setTextColor(120, 128, 145);
  doc.setFontSize(9);
  doc.text("BILLED TO", marginX, 144);
  doc.setTextColor(10, 23, 56);
  doc.setFontSize(12);
  doc.text(accountName || "—", marginX, 162);

  // Line item header.
  doc.setDrawColor(224, 232, 243);
  doc.line(marginX, 196, rightX, 196);
  doc.setTextColor(120, 128, 145);
  doc.setFontSize(9);
  doc.text("DESCRIPTION", marginX, 214);
  doc.text("AMOUNT", rightX, 214, { align: "right" });

  doc.setTextColor(10, 23, 56);
  doc.setFontSize(12);
  doc.text(lineItemLabel(entry), marginX, 238);
  doc.text(amount, rightX, 238, { align: "right" });

  doc.line(marginX, 262, rightX, 262);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Total paid", marginX, 288);
  doc.text(amount, rightX, 288, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(150, 156, 168);
  doc.text(
    "This receipt confirms a payment processed on the Head-Hunters marketplace.",
    marginX,
    324,
  );

  doc.save(`receipt-${number}.pdf`);
}

/** A row in the on-screen receipt. */
function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-navy">{value}</span>
    </div>
  );
}

/**
 * A purchase document for a wallet transaction: opens a formatted receipt in a
 * modal and offers a downloadable PDF of the same. No network call — the
 * receipt is composed from the ledger entry already in hand.
 */
export function PurchaseReceiptDialog({
  entry,
  accountName,
  children,
}: PurchaseReceiptDialogProps) {
  const [open, setOpen] = useState(false);
  const amount = formatMinor(entry.amountMinor);
  const number = receiptNumber(entry.id);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-md border border-border bg-card shadow-card-lg focus:outline-none">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <Dialog.Title className="text-sm font-semibold text-foreground">
              Payment receipt
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex flex-col gap-5 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-heading text-lg font-extrabold text-navy">
                  {BRAND}
                </p>
                <p className="text-xs text-muted-foreground">
                  Receipt #{number}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                Paid
              </span>
            </div>

            <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-4">
              <ReceiptRow
                label="Date"
                value={formatDateTime(entry.createdAt)}
              />
              <ReceiptRow label="Billed to" value={accountName || "—"} />
              <ReceiptRow label="Description" value={lineItemLabel(entry)} />
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm font-semibold text-navy">
                Total paid
              </span>
              <span className="font-heading text-lg font-extrabold tabular-nums text-navy">
                {amount}
              </span>
            </div>

            <Dialog.Description className="text-xs text-muted-foreground">
              This receipt confirms a payment processed on the Head-Hunters
              marketplace.
            </Dialog.Description>

            <Button
              type="button"
              className="w-full"
              onClick={() => downloadReceiptPdf(entry, accountName)}
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
