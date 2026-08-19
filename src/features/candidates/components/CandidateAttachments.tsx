"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText, Paperclip } from "lucide-react";

import { Button } from "@/shared/ui-components/controls/button";
import { formatSize } from "@/shared/utils/formatSize";
import { useAttachments } from "../hooks/useCandidates";

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
            {attachments.data?.map((file) => (
              <li key={file.id} className="flex items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                {/* Presigned link, valid ~15 minutes from this fetch. */}
                <a
                  href={file.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-2 hover:underline"
                >
                  {file.fileName}
                </a>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {formatSize(file.sizeBytes)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
