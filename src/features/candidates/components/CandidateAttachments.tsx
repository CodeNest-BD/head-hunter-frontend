"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText, Paperclip } from "lucide-react";

import { Button } from "@/shared/ui-components/controls/button";
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

interface CandidateAttachmentsProps {
  candidateId: string;
}

/**
 * Collapsible attachment list for one candidate. Fetched only once expanded —
 * every fetch mints fresh presigned URLs, so there is no point requesting
 * links nobody opens.
 */
export function CandidateAttachments({
  candidateId,
}: CandidateAttachmentsProps) {
  const [showFiles, setShowFiles] = useState(false);
  const attachments = useAttachments(candidateId, showFiles);

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShowFiles((open) => !open)}
      >
        <Paperclip className="h-4 w-4" />
        {showFiles ? "Hide attachments" : "Show attachments"}
        {showFiles ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {showFiles && (
        <div className="mt-3 rounded-md border border-border/60 bg-background/50 p-3 text-sm">
          {attachments.isPending && (
            <p className="text-muted-foreground">Loading attachments…</p>
          )}
          {attachments.isError && (
            <p className="text-destructive">Could not load attachments.</p>
          )}
          {attachments.data?.length === 0 && (
            <p className="text-muted-foreground">No attachments.</p>
          )}
          <ul className="flex flex-col gap-1.5">
            {attachments.data?.map((file) => {
              const linkClassName =
                "truncate text-left text-primary underline-offset-2 hover:underline";
              return (
                <li key={file.id} className="flex items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {/* Presigned links, valid ~15 minutes from this fetch. A PDF
                      opens in the preview dialog; anything else downloads,
                      since the browser cannot render it inline anyway. */}
                  {isPdf(file) && file.previewUrl ? (
                    <FilePreviewDialog
                      previewUrl={file.previewUrl}
                      downloadUrl={file.downloadUrl}
                      fileName={file.fileName}
                      sizeBytes={file.sizeBytes}
                    >
                      <button type="button" className={linkClassName}>
                        {file.fileName}
                      </button>
                    </FilePreviewDialog>
                  ) : (
                    <a
                      href={file.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={linkClassName}
                    >
                      {file.fileName}
                    </a>
                  )}
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatSize(file.sizeBytes)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
