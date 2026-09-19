"use client";

import { Download, FileText } from "lucide-react";

import { formatSize } from "@/shared/utils/formatSize";

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
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        Proof
      </p>
      <ul className="flex flex-col gap-1.5">
        {attachments.map((file) => (
          <li
            key={file.id}
            className="flex items-center gap-2.5 rounded-md border border-border bg-card px-3 py-2"
          >
            <FileText className="h-4 w-4 shrink-0 text-primary" />
            <a
              href={file.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 flex-1 truncate text-sm text-primary underline-offset-2 hover:underline"
            >
              {file.fileName}
            </a>
            <span className="shrink-0 text-xs text-muted-foreground">
              {FILED_BY_LABEL[file.uploadedBy]}
            </span>
            {file.sizeBytes !== null && (
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatSize(file.sizeBytes)}
              </span>
            )}
            <a
              href={file.downloadUrl}
              aria-label={`Download ${file.fileName}`}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
