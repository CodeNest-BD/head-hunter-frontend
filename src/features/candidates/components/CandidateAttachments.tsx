"use client";

import { Download, Eye, FileText } from "lucide-react";

import { FilePreviewDialog } from "@/shared/ui-components/feedback/FilePreviewDialog";
import { formatSize } from "@/shared/utils/formatSize";
import { useAttachments } from "../hooks/useCandidates";

/**
 * Only PDFs get an inline preview: the browser renders them natively in a
 * frame, while other types would just trigger a download inside the dialog.
 * Content type is authoritative when present, with the extension as a fallback
 * for rows stored before the type was recorded.
 */
function isPdf(file: {
  contentType: string | null;
  fileName: string;
}): boolean {
  return (
    file.contentType === "application/pdf" ||
    file.fileName.toLowerCase().endsWith(".pdf")
  );
}

const ACTION_CLASS =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-primary";

interface CandidateAttachmentsProps {
  candidateId: string;
}

/**
 * One candidate's files, always loaded — each row is the file name plus a view
 * and a download action. Nothing renders when there are no attachments, so a
 * candidate without files costs no vertical space.
 */
export function CandidateAttachments({
  candidateId,
}: CandidateAttachmentsProps) {
  const attachments = useAttachments(candidateId, true);

  if (attachments.isPending) {
    return <p className="text-sm text-muted-foreground">Loading files…</p>;
  }
  if (attachments.isError) {
    return <p className="text-sm text-destructive">Could not load files.</p>;
  }
  if (!attachments.data?.length) {
    return null;
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {attachments.data.map((file) => (
        <li
          key={file.id}
          className="flex items-center gap-2 rounded-md border border-border/60 bg-background/50 px-3 py-2 text-sm"
        >
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-foreground">
            {file.fileName}
            <span className="ml-2 text-xs tabular-nums text-muted-foreground">
              {formatSize(file.sizeBytes)}
            </span>
          </span>

          {isPdf(file) && file.previewUrl && (
            <FilePreviewDialog
              previewUrl={file.previewUrl}
              downloadUrl={file.downloadUrl}
              fileName={file.fileName}
              sizeBytes={file.sizeBytes}
            >
              <button
                type="button"
                title="View"
                aria-label={`View ${file.fileName}`}
                className={ACTION_CLASS}
              >
                <Eye className="h-4 w-4" />
              </button>
            </FilePreviewDialog>
          )}

          <a
            href={file.downloadUrl}
            title="Download"
            aria-label={`Download ${file.fileName}`}
            className={ACTION_CLASS}
          >
            <Download className="h-4 w-4" />
          </a>
        </li>
      ))}
    </ul>
  );
}
