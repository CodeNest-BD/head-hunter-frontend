"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, ArrowLeft, Plus, UserRound } from "lucide-react";

import {
  CANDIDATE_STATUS_LABELS,
  CandidateAttachments,
  CandidateFields,
  CandidateForm,
  useCandidates,
  useDeleteCandidate,
  type Candidate,
  type CandidateStatus,
} from "@/features/candidates";
import { Thread } from "@/features/conversations";
import {
  candidateNegotiationState,
  type CandidateNegotiationState,
} from "@/features/conversations/utils/candidateNegotiationState";
import { useInterviews } from "@/features/interviews";
import { useJob } from "@/features/jobs";
import { useOffers } from "@/features/offers";
import {
  SubmissionHeader,
  useSubmission,
  type Submission,
  type SubmissionStatus,
} from "@/features/submissions";
import { PageHeader } from "@/shared/ui-components/brand";
import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { ConfirmAction } from "@/shared/ui-components/controls/ConfirmAction";
import { NegotiationActionCards } from "@/shared/ui-components/data/NegotiationActionCards";
import { NegotiationStateBadges } from "@/shared/ui-components/data/NegotiationStateBadges";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";
import { TwoColumnDetailLayout } from "@/shared/ui-components/layout/TwoColumnDetailLayout";
import { RequireApprovedRecruiter, RequireRole } from "@/features/auth";

const MAX_CANDIDATES = 5;

const CANDIDATE_STATUS_STYLES: Record<CandidateStatus, string> = {
  submitted: "bg-primary/15 text-primary",
  reviewing: "text-[#92610C] bg-[#FBF3DF]",
  interviewing: "text-[#92610C] bg-[#FBF3DF]",
  offered: "text-[#17734E] bg-[#E7F4EC]",
  hired: "text-[#17734E] bg-[#E7F4EC]",
  passed: "bg-muted text-muted-foreground",
};

function CardSkeleton() {
  return (
    <div className="h-40 w-full animate-pulse rounded-md border border-border/70 bg-muted" />
  );
}

/**
 * Matches the shape of the loaded left column (header block, then candidate
 * cards) so the page doesn't reflow when the submission and candidates
 * queries resolve — one combined skeleton rather than the header and the
 * candidate list popping in independently at different times.
 */
function LeftColumnSkeleton() {
  return (
    <>
      <div className="h-32 w-full animate-pulse rounded-md border border-border/70 bg-muted" />
      <div className="flex flex-col gap-4">
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </>
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
    <div className="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
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

function CandidateItem({
  candidate,
  submissionId,
  negotiationState,
}: {
  candidate: Candidate;
  submissionId: string;
  /** This candidate's entry from `candidateNegotiationState`, or `null` when
   * the candidate has neither an interview nor an offer yet — derived once
   * per page from the two page-level queries, never looked up per card. */
  negotiationState: CandidateNegotiationState | null;
}) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm-remove">("view");
  const deleteCandidate = useDeleteCandidate(submissionId);

  if (mode === "edit") {
    return (
      <div className="flex flex-col gap-4 rounded-md border border-border/70 bg-card p-5 shadow-sm">
        <CandidateForm
          submissionId={submissionId}
          candidate={candidate}
          onDone={() => setMode("view")}
          onCancel={() => setMode("view")}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border/70 bg-card p-5 shadow-sm">
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
        <StatusBadge
          label={CANDIDATE_STATUS_LABELS[candidate.status]}
          className={CANDIDATE_STATUS_STYLES[candidate.status]}
        />
      </div>

      <NegotiationStateBadges
        interview={negotiationState?.interview ?? null}
        offer={negotiationState?.offer ?? null}
      />

      <NegotiationActionCards
        negotiationState={negotiationState}
        viewerParty="recruiter"
      />

      <CandidateFields candidate={candidate} />

      <CandidateAttachments candidateId={candidate.id} />

      <div className="border-t border-border/60 pt-3">
        {mode === "confirm-remove" ? (
          <ConfirmAction
            message="Remove this candidate? This cannot be undone."
            confirmLabel="Confirm remove"
            busyLabel="Removing…"
            busy={deleteCandidate.isPending}
            onCancel={() => setMode("view")}
            onConfirm={() => deleteCandidate.mutate(candidate.id)}
          />
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

function CandidateListSection({
  submissionId,
  submissionStatus,
  candidates,
  negotiationState,
}: {
  submissionId: string;
  submissionStatus: SubmissionStatus;
  candidates: Candidate[];
  negotiationState: ReturnType<typeof candidateNegotiationState>;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const submissionClosed =
    submissionStatus === "withdrawn" || submissionStatus === "rejected";
  const atCapacity = candidates.length >= MAX_CANDIDATES;
  const disabled = submissionClosed || atCapacity;
  const disabledReason = submissionClosed
    ? "This submission is no longer open for new candidates."
    : atCapacity
      ? `A submission may hold at most ${MAX_CANDIDATES} candidates.`
      : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-border bg-card p-5 shadow-card sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-base font-bold text-navy">
              Candidates
            </h2>
            <p className="text-[13px] text-muted-foreground">
              {candidates.length} of {MAX_CANDIDATES} slots used
            </p>
          </div>
          {/* Stays put while the form is open — hiding it made the header change
              shape on click, and it is the anchor the form appears under. */}
          <Button
            type="button"
            size="sm"
            disabled={disabled}
            title={disabledReason}
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4" />
            Add candidate
          </Button>
        </div>

        {/* One segment per slot — fills as candidates are added. */}
        <div className="mt-4 flex gap-1.5">
          {Array.from({ length: MAX_CANDIDATES }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                i < candidates.length ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>

        {candidates.length === 0 && !isAdding && (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-md border border-dashed border-input bg-secondary/40 px-6 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <UserRound className="h-6 w-6" />
            </span>
            <p className="font-heading text-base font-semibold text-navy">
              No candidates yet
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Add your first candidate to get this submission moving.
            </p>
          </div>
        )}
      </div>

      {/* Above the existing candidates, not after them: opening the form from the
          header would otherwise put it below however many candidates are already
          listed, out of view. */}
      {isAdding && (
        <div className="flex flex-col gap-4 rounded-md border border-border bg-card p-5 shadow-card">
          <CandidateForm
            submissionId={submissionId}
            onDone={() => setIsAdding(false)}
            onCancel={() => setIsAdding(false)}
          />
        </div>
      )}

      {candidates.map((candidate) => (
        <CandidateItem
          key={candidate.id}
          candidate={candidate}
          submissionId={submissionId}
          negotiationState={negotiationState.get(candidate.id) ?? null}
        />
      ))}
    </div>
  );
}

/** Only mounts once the submission has loaded, so it is safe to call
 * `useJob` unconditionally here. */
function SubmissionDetailHeader({ submission }: { submission: Submission }) {
  const job = useJob(submission.jobId);
  const jobTitle = job.data?.title ?? (job.isPending ? "Loading…" : "—");

  return <SubmissionHeader submission={submission} jobTitle={jobTitle} />;
}

/**
 * The left column's info: submission header and candidate list. Fetches
 * both in parallel and gates on a single combined pending/error state, so
 * the two — which read as one grouped "job & candidates" panel — never
 * show one loaded while the other is still a skeleton.
 *
 * Also fetches every interview and offer on this submission — two requests
 * total, scoped by `submissionId` rather than one pair per candidate — and
 * derives the negotiation-state map once here so each `CandidateItem` below
 * only does a `Map` lookup. A failure on either of those two is not fatal to
 * the page: the candidate list stays usable, so it degrades to an empty map
 * (every badge reads "none yet") instead of blocking the whole column the
 * way a failed submission or candidates fetch does.
 */
function SubmissionDetailLeftColumn({
  submissionId,
}: {
  submissionId: string;
}) {
  const submissionQuery = useSubmission(submissionId);
  const candidatesQuery = useCandidates(submissionId);
  const interviewsQuery = useInterviews({ submissionId });
  const offersQuery = useOffers({ submissionId });

  if (submissionQuery.isPending || candidatesQuery.isPending) {
    return <LeftColumnSkeleton />;
  }
  if (submissionQuery.isError) {
    return (
      <ErrorCallout
        message="Could not load this submission."
        onRetry={() => void submissionQuery.refetch()}
      />
    );
  }
  if (candidatesQuery.isError) {
    return (
      <ErrorCallout
        message="Could not load candidates."
        onRetry={() => void candidatesQuery.refetch()}
      />
    );
  }

  const negotiationState = candidateNegotiationState(
    interviewsQuery.data?.data ?? [],
    offersQuery.data?.data ?? [],
  );

  return (
    <>
      <SubmissionDetailHeader submission={submissionQuery.data} />
      <CandidateListSection
        submissionId={submissionId}
        submissionStatus={submissionQuery.data.status}
        candidates={candidatesQuery.data}
        negotiationState={negotiationState}
      />
    </>
  );
}

export default function SubmissionDetailPage() {
  const params = useParams<{ id: string }>();

  return (
    <RequireRole role="recruiter">
      <DashboardLayout wide="detail">
        {/* Keeps the submission/candidates queries and the conversation
         * socket from ever mounting for an unapproved recruiter — both live
         * inside `left`/`right` below, which `RequireApprovedRecruiter`
         * swaps out entirely rather than rendering hidden. */}
        <RequireApprovedRecruiter>
          <TwoColumnDetailLayout
            header={
              <div className="flex flex-col gap-6">
                <Link
                  href="/recruiter/submissions"
                  className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to submissions
                </Link>
                <PageHeader
                  title="Submission detail"
                  subtitle="Track your candidates and the job you submitted them to."
                />
              </div>
            }
            left={<SubmissionDetailLeftColumn submissionId={params.id} />}
            right={<Thread submissionId={params.id} />}
          />
        </RequireApprovedRecruiter>
      </DashboardLayout>
    </RequireRole>
  );
}
