"use client";

import { Download, FileText } from "lucide-react";

import { formatSize } from "@/shared/utils/formatSize";
import { ListRow } from "@/shared/ui-components/list/ListRow";
import { Tile } from "@/shared/ui-components/list/Tile";

import type { DisputeAttachment } from "../schemas";

const FILED_BY_LABEL: Record<DisputeAttachment["uploadedBy"], string> = {
  company: "Company",
  recruiter: "Recruiter",
};

/**
 * The proof filed with a dispute, read-only for everyone who can see it — the
 * two parties and the admin deciding. Links are minted per read and expire, so
 * nothing here is bookmarkable by design.
 */
export function DisputeProofList({
  attachments,
}: {
  attachments: DisputeAttachment[];
}) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-label font-[650] uppercase text-ink-muted">Proof</p>
      <ul className="overflow-hidden rounded-sm border border-line bg-surface">
        {attachments.map((file) => (
          // `.listrow` — each document is one evidence row led by a tile. The
          // row renders as the `<li>` itself, so its `last:` rule can fire.
          <ListRow key={file.id} element="li" className="items-center gap-2.5">
            <Tile icon={FileText} tone="neutral" />
            <a
              href={file.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 flex-1 truncate text-sub font-[550] text-blue-ink underline-offset-2 hover:underline"
            >
              {file.fileName}
            </a>
            <span className="shrink-0 text-meta text-ink-faint">
              {FILED_BY_LABEL[file.uploadedBy]}
            </span>
            {file.sizeBytes !== null && (
              <span className="shrink-0 tabular-nums text-meta text-ink-faint">
                {formatSize(file.sizeBytes)}
              </span>
            )}
            <a
              href={file.downloadUrl}
              aria-label={`Download ${file.fileName}`}
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-xs text-ink-faint transition-colors hover:bg-surface-sunken hover:text-ink"
            >
              <Download className="size-[15px]" />
            </a>
          </ListRow>
        ))}
      </ul>
    </div>
  );
}
