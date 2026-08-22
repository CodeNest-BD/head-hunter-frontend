"use client";

import { useParams } from "next/navigation";
import { AlertCircle, FileText, UserRound } from "lucide-react";

import { RequireRole } from "@/features/auth";
import {
  CandidateCard,
  useCandidates,
  type Candidate,
} from "@/features/candidates";
import { Thread } from "@/features/conversations";
import { candidateNegotiationState } from "@/features/conversations/utils/candidateNegotiationState";
import { useInterviews } from "@/features/interviews";
import { useOffers } from "@/features/offers";
import {
  COMPANY_SETTABLE_STATUSES,
  SUBMISSION_STATUS_LABELS,
  recruiterDisplayName,
  useSubmission,
  useUpdateSubmissionStatus,
  type Submission,
  type SubmissionStatus,
} from "@/features/submissions";
import { Eyebrow, PageHeader } from "@/shared/ui-components/brand";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";
import { TwoColumnDetailLayout } from "@/shared/ui-components/layout/TwoColumnDetailLayout";

const STATUS_STYLES: Record<SubmissionStatus, string> = {
  submitted: "bg-primary/15 text-primary",
  under_review: "text-[#92610C] bg-[#FBF3DF]",
  advanced: "text-[#17734E] bg-[#E7F4EC]",
  rejected: "bg-muted text-muted-foreground",
  withdrawn: "bg-muted text-muted-foreground",
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
      <div className="h-40 w-full animate-pulse rounded-md border border-border/70 bg-muted" />
      <div className="flex flex-col gap-4">
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
          <button
            type="button"
            className="rounded-md border border-destructive/40 px-3 py-1 text-xs font-medium transition-colors hover:bg-destructive/10"
            onClick={() => void onRetry()}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

function CandidateListSection({
  submissionId,
  candidates,
  negotiationState,
}: {
  submissionId: string;
  candidates: Candidate[];
  negotiationState: ReturnType<typeof candidateNegotiationState>;
}) {
  if (candidates.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-[#C9D0DF] bg-card px-6 py-12 text-center shadow-card">
        <div className="flex flex-col items-center gap-3">
          <Eyebrow>No candidates</Eyebrow>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UserRound className="h-6 w-6" />
          </span>
          <p className="font-heading text-base font-semibold text-navy">
            No candidates yet
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            This submission has no candidates on it yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {candidates.map((candidate) => (
        <CandidateCard
          key={candidate.id}
          candidate={candidate}
          submissionId={submissionId}
          negotiationState={negotiationState.get(candidate.id) ?? null}
        />
      ))}
    </div>
  );
}

function SubmissionInfoHeader({ submission }: { submission: Submission }) {
  const updateStatus = useUpdateSubmissionStatus(submission.id);

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border bg-card p-4 shadow-card">
      {/* Two lines, not four: the name carries the status badge beside it and the
          secondary detail sits on one muted line under it, so the header does not
          out-tall the one control it holds. */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <UserRound className="h-[18px] w-[18px]" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-heading text-base font-semibold text-navy">
              {recruiterDisplayName(submission.recruiter)}
            </p>
            <StatusBadge
              label={SUBMISSION_STATUS_LABELS[submission.status]}
              className={STATUS_STYLES[submission.status]}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Submitted by this recruiter
            {submission.recruiter?.yearsExperience !== null &&
              submission.recruiter !== null &&
              ` · ${submission.recruiter.yearsExperience} years of recruiting experience`}
          </p>
        </div>

        <div className="shrink-0">
          {/* The visible label is dropped: the select already carries an
              aria-label, and the badge beside the name says what the status is. */}
          <select
            id="submission-status"
            aria-label="Submission status"
            value={
              COMPANY_SETTABLE_STATUSES.includes(
                submission.status as (typeof COMPANY_SETTABLE_STATUSES)[number],
              )
                ? submission.status
                : ""
            }
            disabled={
              updateStatus.isPending || submission.status === "withdrawn"
            }
            onChange={(event) =>
              updateStatus.mutate(event.target.value as SubmissionStatus)
            }
            className="h-9 rounded-md border border-input bg-card px-3 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {/* `withdrawn` is the recruiter's action, so it is not offered here. */}
            {submission.status === "withdrawn" && (
              <option value="">Withdrawn</option>
            )}
            {COMPANY_SETTABLE_STATUSES.map((value) => (
              <option key={value} value={value}>
                {SUBMISSION_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {submission.note && (
        <div className="flex flex-col gap-1.5 rounded-md border border-border/60 bg-background/50 p-4">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            Recruiter note
          </p>
          <p className="whitespace-pre-wrap text-sm text-foreground">
            {submission.note}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * The left column's info: submission header and candidate list. Fetches
 * both in parallel and gates on a single combined pending/error state, so
 * the two — which read as one grouped "job & candidates" panel — never
 * show one loaded while the other is still a skeleton.
 *
 * Also fetches every interview and offer on this submission — two requests
 * total, scoped by `submissionId` rather than one pair per candidate — and
 * derives the negotiation-state map once here so each `CandidateCard` below
 * only does a `Map` lookup. A failure on either of those two is not fatal to
 * the page: the candidate list and status controls stay usable, so it
 * degrades to an empty map (every badge reads "none yet") instead of
 * blocking the whole column the way a failed submission or candidates fetch
 * does.
 */
function SubmissionDetailLeftColumn({
  submissionId,
}: {
  submissionId: string;
}) {
  const submissionQuery = useSubmission(submissionId);
  const candidatesQuery = useCandidates(submissionId);
  // `limit` is explicit rather than left to the API's default of 20: a
  // submission caps at 5 candidates, but each can accumulate any number of
  // interviews and offers over a negotiation, and the pickers below need the
  // latest of each — not the first page of the oldest.
  const interviewsQuery = useInterviews({ submissionId, limit: 100 });
  const offersQuery = useOffers({ submissionId, limit: 100 });

  // Interviews and offers gate the skeleton too, even though a failure on
  // either is non-fatal below: until they have resolved, `negotiationState` is
  // empty, so every action would render enabled and a click on a candidate who
  // already has a live offer or open interview would earn a raw 409 instead of
  // the readable reason those controls exist to give. `isPending` is false on
  // error, so a failure still degrades to an empty map rather than a stuck
  // skeleton.
  if (
    submissionQuery.isPending ||
    candidatesQuery.isPending ||
    interviewsQuery.isPending ||
    offersQuery.isPending
  ) {
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
      <SubmissionInfoHeader submission={submissionQuery.data} />
      <CandidateListSection
        submissionId={submissionId}
        candidates={candidatesQuery.data}
        negotiationState={negotiationState}
      />
    </>
  );
}

export default function SubmissionReviewPage() {
  const params = useParams<{ id: string }>();

  return (
    <RequireRole role="company">
      <DashboardLayout wide="detail">
        <TwoColumnDetailLayout
          header={
            <PageHeader
              title="Review submission"
              subtitle="The recruiter, their note, and every candidate on this submission."
            />
          }
          left={<SubmissionDetailLeftColumn submissionId={params.id} />}
          right={<Thread submissionId={params.id} />}
        />
      </DashboardLayout>
    </RequireRole>
  );
}
