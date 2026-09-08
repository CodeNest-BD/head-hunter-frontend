"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { fetchBenefitsAttachmentUrl } from "../api/jobs";
import type { BenefitsAttachment } from "../schemas";

/**
 * Downloads the job's benefits document.
 *
 * A button rather than an `<a href>`: the object is private and the link that
 * reaches it is signed on demand by an authenticated call, so there is no
 * stable URL to put in an anchor. Signed on click rather than on render — a
 * link nobody opens is not worth requesting.
 */
export function BenefitsDocumentLink({
  jobId,
  attachment,
}: {
  jobId: string;
  attachment: BenefitsAttachment;
}) {
  const [isOpening, setIsOpening] = useState(false);

  const open = async () => {
    setIsOpening(true);
    try {
      const url = await fetchBenefitsAttachmentUrl(jobId);
      // Same tab, not a new one: the signed link carries an attachment
      // disposition, so the browser saves the file and stays put — and a tab
      // opened this long after the click is what popup blockers stop.
      window.location.assign(url);
    } catch {
      toast.error("Could not open the benefits document. Please try again.");
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void open()}
      disabled={isOpening}
      className="inline-flex max-w-full items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80 disabled:opacity-60"
    >
      <Download className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{attachment.fileName}</span>
    </button>
  );
}
