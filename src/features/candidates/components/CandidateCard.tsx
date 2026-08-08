"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText, Paperclip } from "lucide-react";

import { formatMinor } from "@/shared/utils/money";
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
    <Card className="border-border/70 transition-colors hover:border-border">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex flex-col gap-1">
          <CardTitle className="font-heading tracking-tight">
            {candidate.fullName}
          </CardTitle>
          <CardDescription>
            <a
              href={`mailto:${candidate.email}`}
              className="text-primary underline-offset-2 hover:underline"
            >
              {candidate.email}
            </a>
            {candidate.phone ? ` · ${candidate.phone}` : ""}
          </CardDescription>
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`candidate-status-${candidate.id}`}
            className="text-xs font-medium text-muted-foreground"
          >
            Status
          </label>
          <select
            id={`candidate-status-${candidate.id}`}
            aria-label={`Status for ${candidate.fullName}`}
            value={candidate.status}
            disabled={updateStatus.isPending}
            onChange={(event) =>
              updateStatus.mutate({
                id: candidate.id,
                status: event.target.value as CandidateStatus,
              })
            }
            className="h-9 shrink-0 rounded-md border border-input bg-card px-3 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {CANDIDATE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {CANDIDATE_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {candidate.overview && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {candidate.overview}
          </p>
        )}

        <div className="flex flex-col gap-2 text-sm">
          {candidate.linkedinUrl && (
            <div>
              <a
                href={candidate.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-2 hover:underline"
              >
                LinkedIn Profile
              </a>
            </div>
          )}

          {candidate.yearsOfExperience !== null && (
            <div className="text-muted-foreground">
              {candidate.yearsOfExperience} yrs experience
            </div>
          )}

          {candidate.currentCompany && (
            <div className="text-muted-foreground">
              {candidate.currentCompany}
            </div>
          )}

          {candidate.expectedSalaryMinor !== null && (
            <div className="text-muted-foreground">
              {formatMinor(candidate.expectedSalaryMinor)} expected salary
            </div>
          )}

          {candidate.noticePeriodDays !== null && (
            <div className="text-muted-foreground">
              {candidate.noticePeriodDays}-day notice
            </div>
          )}
        </div>

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
        </div>

        {showFiles && (
          <div className="rounded-lg border border-border/60 bg-background/50 p-3 text-sm">
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
      </CardContent>
    </Card>
  );
}
