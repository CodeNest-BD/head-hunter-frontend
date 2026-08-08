"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  Paperclip,
  Plus,
} from "lucide-react";

import {
  CANDIDATE_STATUS_LABELS,
  CandidateForm,
  useAttachments,
  useCandidates,
  useDeleteCandidate,
  type Candidate,
  type CandidateStatus,
} from "@/features/candidates";
import { useJob } from "@/features/jobs";
import {
  SubmissionHeader,
  useSubmission,
  type Submission,
  type SubmissionStatus,
} from "@/features/submissions";
import { PageHeader } from "@/shared/ui-components/brand";
import { Button } from "@/shared/ui-components/controls/button";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatMinor } from "@/shared/utils/money";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";
import { RequireRole } from "@/features/auth";

const MAX_CANDIDATES = 5;

const CANDIDATE_STATUS_STYLES: Record<CandidateStatus, string> = {
  submitted: "bg-primary/15 text-primary",
  reviewing: "text-[#92610C] bg-[#FBF3DF]",
  interviewing: "text-[#92610C] bg-[#FBF3DF]",
  offered: "text-[#17734E] bg-[#E7F4EC]",
  hired: "text-[#17734E] bg-[#E7F4EC]",
  passed: "bg-muted text-muted-foreground",
};

function formatSize(bytes: number | null): string {
  if (bytes === null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function CardSkeleton() {
  return (
    <div className="h-40 w-full animate-pulse rounded-xl border border-border/70 bg-muted" />
  );
}

function ErrorCallout({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
      <div className="flex items-center gap-2 font-medium">
        <AlertCircle className="h-[18px] w-[18px] shrink-0" />
        {message}
      </div>
      {onRetry && (
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void onRetry()}
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}

function CandidateAttachments({ candidateId }: { candidateId: string }) {
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
        <div className="mt-3 rounded-lg border border-border/60 bg-background/50 p-3 text-sm">
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

function CandidateItem({
  candidate,
  submissionId,
}: {
  candidate: Candidate;
  submissionId: string;
}) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm-remove">(
    "view",
  );
  const deleteCandidate = useDeleteCandidate(submissionId);

  if (mode === "edit") {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-5 shadow-sm">
        <CandidateForm
          submissionId={submissionId}
          candidate={candidate}
          onDone={() => setMode("view")}
        />
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setMode("view")}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="font-heading text-base font-semibold text-foreground">
            {candidate.fullName}
          </p>
          <p className="text-sm text-muted-foreground">
            <a
              href={`mailto:${candidate.email}`}
              className="text-primary underline-offset-2 hover:underline"
            >
              {candidate.email}
            </a>
            {candidate.phone ? ` · ${candidate.phone}` : ""}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
            CANDIDATE_STATUS_STYLES[candidate.status],
          )}
        >
          {CANDIDATE_STATUS_LABELS[candidate.status]}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
        {candidate.currentCompany && (
          <div>
            <dt className="text-xs text-muted-foreground">
              Current company
            </dt>
            <dd className="text-foreground">{candidate.currentCompany}</dd>
          </div>
        )}
        {candidate.yearsOfExperience !== null && (
          <div>
            <dt className="text-xs text-muted-foreground">Experience</dt>
            <dd className="text-foreground">
              {candidate.yearsOfExperience} yrs
            </dd>
          </div>
        )}
        {candidate.expectedSalaryMinor !== null && (
          <div>
            <dt className="text-xs text-muted-foreground">
              Expected salary
            </dt>
            <dd className="text-foreground">
              {formatMinor(candidate.expectedSalaryMinor)}
            </dd>
          </div>
        )}
        {candidate.noticePeriodDays !== null && (
          <div>
            <dt className="text-xs text-muted-foreground">Notice period</dt>
            <dd className="text-foreground">
              {candidate.noticePeriodDays} days
            </dd>
          </div>
        )}
        {candidate.linkedinUrl && (
          <div>
            <dt className="text-xs text-muted-foreground">LinkedIn</dt>
            <dd>
              <a
                href={candidate.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline-offset-2 hover:underline"
              >
                Profile
              </a>
            </dd>
          </div>
        )}
      </dl>

      {candidate.overview && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {candidate.overview}
        </p>
      )}

      <CandidateAttachments candidateId={candidate.id} />

      <div className="border-t border-border/60 pt-3">
        {mode === "confirm-remove" ? (
          <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 sm:flex-row sm:items-center">
            <p className="text-xs text-destructive">
              Remove this candidate? This cannot be undone.
            </p>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMode("view")}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={deleteCandidate.isPending}
                onClick={() => deleteCandidate.mutate(candidate.id)}
              >
                {deleteCandidate.isPending ? "Removing…" : "Confirm remove"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMode("edit")}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMode("confirm-remove")}
            >
              Remove
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function AddCandidateSection({
  submissionId,
  candidateCount,
  submissionStatus,
}: {
  submissionId: string;
  candidateCount: number;
  submissionStatus: SubmissionStatus;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const submissionClosed =
    submissionStatus === "withdrawn" || submissionStatus === "rejected";
  const atCapacity = candidateCount >= MAX_CANDIDATES;
  const disabled = submissionClosed || atCapacity;
  const disabledReason = submissionClosed
    ? "This submission is no longer open for new candidates."
    : atCapacity
      ? `A submission may hold at most ${MAX_CANDIDATES} candidates.`
      : undefined;

  if (isAdding) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-5 shadow-sm">
        <CandidateForm
          submissionId={submissionId}
          onDone={() => setIsAdding(false)}
        />
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(false)}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Button
        type="button"
        disabled={disabled}
        title={disabledReason}
        onClick={() => setIsAdding(true)}
      >
        <Plus className="h-[18px] w-[18px]" />
        Add candidate
      </Button>
    </div>
  );
}

function CandidateSection({
  submissionId,
  submissionStatus,
}: {
  submissionId: string;
  submissionStatus: SubmissionStatus;
}) {
  const { data, isPending, isError, refetch } = useCandidates(submissionId);

  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }
  if (isError) {
    return (
      <ErrorCallout
        message="Could not load candidates."
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-heading text-lg font-semibold text-foreground">
        Candidates ({data.length}/{MAX_CANDIDATES})
      </h2>

      {data.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#C9D2E3] bg-card px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            No candidates on this submission yet.
          </p>
        </div>
      )}

      {data.map((candidate) => (
        <CandidateItem
          key={candidate.id}
          candidate={candidate}
          submissionId={submissionId}
        />
      ))}

      <AddCandidateSection
        submissionId={submissionId}
        candidateCount={data.length}
        submissionStatus={submissionStatus}
      />
    </div>
  );
}

/** Only mounts once the submission has loaded, so it is safe to call
 * `useJob` unconditionally here. */
function SubmissionDetailBody({ submission }: { submission: Submission }) {
  const job = useJob(submission.jobId);
  const jobTitle = job.data?.title ?? (job.isPending ? "Loading…" : "—");

  return (
    <div className="flex flex-col gap-6">
      <SubmissionHeader submission={submission} jobTitle={jobTitle} />
      <CandidateSection
        submissionId={submission.id}
        submissionStatus={submission.status}
      />
    </div>
  );
}

function SubmissionDetailContent({ submissionId }: { submissionId: string }) {
  const { data: submission, isPending, isError, refetch } =
    useSubmission(submissionId);

  if (isPending) {
    return <CardSkeleton />;
  }
  if (isError) {
    return (
      <ErrorCallout
        message="Could not load this submission."
        onRetry={() => void refetch()}
      />
    );
  }

  return <SubmissionDetailBody submission={submission} />;
}

export default function SubmissionDetailPage() {
  const params = useParams<{ id: string }>();

  return (
    <RequireRole role="recruiter">
      <DashboardLayout>
        <div className="flex max-w-3xl flex-col gap-6">
          <Link
            href="/recruiter/submissions"
            className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to submissions
          </Link>
          <PageHeader
            eyebrow="Submission"
            title="Submission detail"
            subtitle="Track your candidates and the job you submitted them to."
            className="mb-0"
          />
          <SubmissionDetailContent submissionId={params.id} />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
