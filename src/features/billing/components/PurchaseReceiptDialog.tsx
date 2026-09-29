"use client";

import { useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { jsPDF } from "jspdf";
import { Download, X } from "lucide-react";

import { Button } from "@/shared/ui-components/controls/button";
import { Pill } from "@/shared/ui-components/badges/Pill";
import { Logo } from "@/shared/ui-components/layout/Logo";
import { formatDateTime } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { LEDGER_TYPE_LABELS, type LedgerEntry } from "../schemas";
import {
  DIALOG_OVERLAY,
  DIALOG_TITLE,
} from "@/shared/ui-components/feedback/dialogStyles";

interface PurchaseReceiptDialogProps {
  entry: LedgerEntry;
  /** The account the receipt is billed to (the signed-in user's name). */
  accountName: string;
  /** The element that opens the receipt. */
  children: ReactNode;
}

const LOGO_MARK_SRC = "/assets/brand/logo-mark.png";
/** The wordmark drawn in the PDF, colour-matched to the brand lockup. */
const WORDMARK: ReadonlyArray<{ text: string; rgb: [number, number, number] }> =
  [
    { text: "Head", rgb: [10, 23, 56] },
    { text: "-", rgb: [3, 74, 239] },
    { text: "Hunters.", rgb: [10, 23, 56] },
    { text: "com", rgb: [133, 138, 152] },
  ];

/** A short, human-friendly receipt number derived from the ledger id. */
function receiptNumber(id: string): string {
  return id.replace(/-/g, "").slice(0, 10).toUpperCase();
}

function lineItemLabel(entry: LedgerEntry): string {
  return entry.description ?? LEDGER_TYPE_LABELS[entry.entryType];
}

/** Loads a same-origin image as a data URL so jsPDF can embed it. */
async function loadImageDataUrl(src: string): Promise<string> {
  const res = await fetch(src);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read logo image"));
    reader.readAsDataURL(blob);
  });
}

/** Builds and saves a standalone PDF receipt for the transaction. */
async function downloadReceiptPdf(
  entry: LedgerEntry,
  accountName: string,
): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 56;
  const rightX = 540;
  const amount = formatMinor(entry.amountMinor);
  const number = receiptNumber(entry.id);

  // Brand lockup: the crosshair mark (if it loads) plus the coloured wordmark.
  let wordmarkX = marginX;
  try {
    const markDataUrl = await loadImageDataUrl(LOGO_MARK_SRC);
    const markH = 22;
    const markW = markH * (292 / 298);
    doc.addImage(markDataUrl, "PNG", marginX, 54, markW, markH);
    wordmarkX = marginX + markW + 8;
  } catch {
    // Logo is decorative — fall back to the wordmark alone.
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  for (const part of WORDMARK) {
    doc.setTextColor(part.rgb[0], part.rgb[1], part.rgb[2]);
    doc.text(part.text, wordmarkX, 72);
    wordmarkX += doc.getTextWidth(part.text);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(120, 128, 145);
  doc.text("Payment receipt", marginX, 92);

  doc.setFontSize(10);
  doc.text(`Receipt #${number}`, rightX, 68, { align: "right" });
  doc.text(formatDateTime(entry.createdAt), rightX, 84, { align: "right" });

  doc.setDrawColor(224, 232, 243);
  doc.line(marginX, 116, rightX, 116);

  doc.setTextColor(120, 128, 145);
  doc.setFontSize(9);
  doc.text("BILLED TO", marginX, 144);
  doc.setTextColor(10, 23, 56);
  doc.setFontSize(12);
  doc.text(accountName || "—", marginX, 162);

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
    <div className="flex items-center justify-between gap-4 text-sub">
      <span className="text-ink-muted">{label}</span>
      <span className="text-right font-[550] text-ink">{value}</span>
    </div>
  );
}

/**
 * A purchase document for a wallet transaction: opens a formatted receipt in a
 * modal and offers a downloadable PDF of the same. No network call for the data
 * — the receipt is composed from the ledger entry already in hand.
 */
export function PurchaseReceiptDialog({
  entry,
  accountName,
  children,
}: PurchaseReceiptDialogProps) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const amount = formatMinor(entry.amountMinor);
  const number = receiptNumber(entry.id);

  const onDownload = async () => {
    setDownloading(true);
    try {
      await downloadReceiptPdf(entry, accountName);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={DIALOG_OVERLAY} />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-x-hidden overflow-y-auto rounded-lg border border-line bg-surface shadow-pop focus:outline-none">
          <div className="flex items-center justify-between gap-2.5 border-b border-line px-4 py-3">
            <Dialog.Title className={DIALOG_TITLE}>
              Payment receipt
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-xs text-ink-faint transition-colors hover:bg-surface-sunken hover:text-ink"
              >
                <X className="size-[15px]" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex flex-col gap-4 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Logo className="h-7" />
                <p className="mt-1.5 text-meta tabular-nums text-ink-faint">
                  Receipt #{number}
                </p>
              </div>
              <Pill tone="ok" plain>
                Paid
              </Pill>
            </div>

            {/* `.well` — the receipt's facts on the sunken sub-surface. */}
            <div className="flex flex-col gap-2 rounded-sm border border-line bg-surface-sub px-3 py-2.5">
              <ReceiptRow
                label="Date"
                value={formatDateTime(entry.createdAt)}
              />
              <ReceiptRow label="Billed to" value={accountName || "—"} />
              <ReceiptRow label="Description" value={lineItemLabel(entry)} />
            </div>

            <div className="flex items-center justify-between border-t border-line pt-3.5">
              <span className="text-block font-[650] text-ink">Total paid</span>
              <span className="text-section font-extrabold tabular-nums text-ink">
                {amount}
              </span>
            </div>

            <Dialog.Description className="text-meta text-ink-faint">
              This receipt confirms a payment processed on the Head-Hunters
              marketplace.
            </Dialog.Description>

            <Button
              type="button"
              className="w-full"
              disabled={downloading}
              onClick={() => void onDownload()}
            >
              <Download />
              {downloading ? "Preparing…" : "Download PDF"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
