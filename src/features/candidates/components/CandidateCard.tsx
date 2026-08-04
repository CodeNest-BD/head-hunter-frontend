"use client";

import { useState } from "react";
import { Button } from "@/shared/ui-components/controls/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";
import {
  useAttachments,
  useUpdateCandidateStatus,
} from "../hooks/useCandidates";
import {
  CANDIDATE_STATUSES,
  CANDIDATE_STATUS_LABELS,
  type Candidate,
  type CandidateStatus,
} from "../schemas";

interface CandidateCardProps {
  candidate: Candidate;
  submissionId: string;
}

function formatSize(bytes: number | null): string {
  if (bytes === null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CandidateCard({ candidate, submissionId }: CandidateCardProps) {
  const [showFiles, setShowFiles] = useState(false);
  const attachments = useAttachments(candidate.id, showFiles);
  const updateStatus = useUpdateCandidateStatus(submissionId);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex flex-col gap-1">
          <CardTitle>{candidate.fullName}</CardTitle>
          <CardDescription>
            <a href={`mailto:${candidate.email}`} className="underline">
              {candidate.email}
            </a>
            {candidate.phone ? ` · ${candidate.phone}` : ""}
          </CardDescription>
        </div>
        <select
          aria-label={`Status for ${candidate.fullName}`}
          value={candidate.status}
          disabled={updateStatus.isPending}
          onChange={(event) =>
            updateStatus.mutate({
              id: candidate.id,
              status: event.target.value as CandidateStatus,
            })
          }
          className="h-9 shrink-0 rounded-md border border-input bg-transparent px-2 text-sm"
        >
          {CANDIDATE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {CANDIDATE_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {candidate.overview && (
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {candidate.overview}
          </p>
        )}

        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowFiles((open) => !open)}
          >
            {showFiles ? "Hide attachments" : "Show attachments"}
          </Button>
        </div>

        {showFiles && (
          <div className="text-sm">
            {attachments.isPending && (
              <p className="text-muted-foreground">Loading attachments…</p>
            )}
            {attachments.isError && (
              <p className="text-destructive">Could not load attachments.</p>
            )}
            {attachments.data?.length === 0 && (
              <p className="text-muted-foreground">No attachments.</p>
            )}
            <ul className="flex flex-col gap-1">
              {attachments.data?.map((file) => (
                <li key={file.id}>
                  {/* Presigned link, valid ~15 minutes from this fetch. */}
                  <a
                    href={file.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    {file.fileName}
                  </a>
                  <span className="ml-2 text-muted-foreground">
                    {formatSize(file.sizeBytes)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
