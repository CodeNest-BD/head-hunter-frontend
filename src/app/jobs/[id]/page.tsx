"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import { AlertCircle, ArrowLeft, Send, Wallet } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { RequireApprovedRecruiter, useAuth } from "@/features/auth";
import {
  EMPLOYMENT_TYPE_LABELS,
  ROLE_CATEGORY_LABELS,
  useJob,
} from "@/features/jobs";
import { useIsVerifiedRecruiter } from "@/features/recruiters";
import { PublicShell } from "@/components/landing/PublicShell";
import { PageHeader } from "@/shared/ui-components/brand";
import { Button } from "@/shared/ui-components/controls/button";
import { formatMinor } from "@/shared/utils/money";
import { RichTextView } from "@/shared/ui-components/data/RichTextView";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";
import type { EmploymentType, RoleCategory } from "@/features/jobs";

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-28 w-full animate-pulse rounded-md border border-border/70 bg-muted" />
      <div className="h-80 w-full animate-pulse rounded-md border border-border/70 bg-muted" />
    </div>
  );
}

/** The fields both data sources share, normalized for one renderer. */
interface JobView {
  title: string;
  roleCategory: string;
  employmentType: string | null;
  locationCity: string | null;
  locationState: string | null;
  isRemote: boolean;
  salaryMinMinor: number | null;
  salaryMaxMinor: number | null;
  recruiterFeeMinor: number;
  publishedAt: Date | null;
  description: string | null;
}

/** One label/value fact in the header card. */
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 truncate font-medium text-navy">{value}</p>
    </div>
  );
}

/** Fee + the role's facts, the strip a recruiter scans first. */
function FactsCard({ job }: { job: JobView }) {
  const location = job.isRemote
    ? "Remote"
    : [job.locationCity, job.locationState].filter(Boolean).join(", ") || "—";
  const salary =
    job.salaryMinMinor === null && job.salaryMaxMinor === null
      ? "—"
      : `${formatMinor(job.salaryMinMinor)} – ${formatMinor(job.salaryMaxMinor)}`;
  const employmentType = job.employmentType
    ? (EMPLOYMENT_TYPE_LABELS[job.employmentType as EmploymentType] ?? "—")
    : "—";
  const posted = job.publishedAt
    ? formatDistanceToNow(job.publishedAt, { addSuffix: true })
    : "—";
  const category =
    ROLE_CATEGORY_LABELS[job.roleCategory as RoleCategory] ?? "Other";

  return (
    <div className="flex flex-col divide-y divide-border rounded-md border border-border bg-card shadow-card md:flex-row md:divide-x md:divide-y-0">
      <div className="flex items-center gap-3 p-5 sm:p-6 md:w-72">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
          <Wallet className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Recruiter fee
          </p>
          <p className="font-heading text-2xl font-extrabold tabular-nums text-navy">
            {formatMinor(job.recruiterFeeMinor)}
          </p>
          <p className="text-xs text-muted-foreground">on a successful hire</p>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-x-6 gap-y-4 p-5 sm:grid-cols-2 sm:p-6">
        <Fact label="Category" value={category} />
        <Fact label="Location" value={location} />
        <Fact label="Salary range" value={salary} />
        <Fact label="Employment type" value={employmentType} />
        <Fact label="Posted" value={posted} />
        <Fact label="Work model" value={job.isRemote ? "Remote" : "On-site"} />
      </div>
    </div>
  );
}

function DescriptionCard({ description }: { description: string | null }) {
  return (
    <section className="rounded-md border border-border bg-card p-5 shadow-card sm:p-6">
      <h2 className="mb-3 font-heading text-lg font-bold tracking-tight text-navy">
        Description
      </h2>
      {description ? (
        <RichTextView value={description} />
      ) : (
        <p className="text-sm text-muted-foreground">
          No description provided for this role.
        </p>
      )}
    </section>
  );
}

function JobBody({ job, cta }: { job: JobView; cta: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <FactsCard job={job} />
      {cta ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <DescriptionCard description={job.description} />
          <aside className="h-fit lg:sticky lg:top-24">
            <div className="rounded-md border border-border bg-card p-5 shadow-card">
              <h2 className="font-heading text-base font-bold text-navy">
                Ready to submit?
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                Open the workspace to add candidates and message the company.
              </p>
              <div className="mt-4">{cta}</div>
            </div>
          </aside>
        </div>
      ) : (
        <DescriptionCard description={job.description} />
      )}
    </div>
  );
}

/**
 * The page's single call to action for a VERIFIED recruiter. It opens the
 * submission-scoped workspace, which is where candidates are submitted AND
 * where the thread with the company lives — so this one button serves both
 * intents.
 */
function SubmitCandidatesButton({ jobId }: { jobId: string }) {
  // Sending a candidate IS the act that puts a recruiter on a job now, so
  // there is nothing to "open" first — this goes straight to the job's
  // candidate list, where the form to add one lives.
  return (
    <Button asChild type="button" className="w-full">
      <Link href={`/recruiter/inbox/job/${jobId}`}>
        <Send className="h-[18px] w-[18px]" />
        Submit candidates
      </Link>
    </Button>
  );
}

function RecruiterCta({ jobId }: { jobId: string }) {
  const { isVerified, verificationStatus, isLoading } =
    useIsVerifiedRecruiter();
  if (isLoading) return null;
  if (isVerified) return <SubmitCandidatesButton jobId={jobId} />;
  return (
    <div className="flex flex-col gap-1.5">
      <Button type="button" className="w-full" disabled>
        <Send className="h-[18px] w-[18px]" />
        Submit candidates
      </Button>
      <p className="text-xs text-muted-foreground">
        {verificationStatus === "rejected"
          ? "Your verification was declined — see your "
          : "Submitting unlocks once you're verified — check your "}
        <Link
          href="/recruiter/profile"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          profile
        </Link>
        .
      </p>
    </div>
  );
}

/**
 * Fetches and renders the job itself. Deliberately kept as a child mounted
 * only inside `RequireApprovedRecruiter` (see `AuthedJobDetail`) rather than
 * called at that component's own top level — an unapproved recruiter must
 * never fire this request at all, not just have its result hidden, or they'd
 * still eat a 403 toast on every visit.
 */
function AuthedJobBody({ jobId, role }: { jobId: string; role: string }) {
  const { data: job, isPending, isError, refetch } = useJob(jobId);

  return (
    <>
      <PageHeader
        title={job?.title ?? "Job detail"}
        subtitle="The fee, the role, and everything you need before you submit a candidate."
        className="mb-0"
      />
      {isPending ? (
        <DetailSkeleton />
      ) : isError || !job ? (
        <div className="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-[18px] w-[18px]" />
            Could not load this job. It may have expired or been closed.
          </div>
          <button
            type="button"
            className="self-start rounded-md border border-destructive/40 px-3 py-1 text-xs font-medium transition-colors hover:bg-destructive/10"
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </div>
      ) : (
        <JobBody
          job={job}
          cta={role === "recruiter" ? <RecruiterCta jobId={jobId} /> : null}
        />
      )}
    </>
  );
}

/** Signed-in view: authed endpoint (role visibility rules), dashboard chrome.
 * `RequireApprovedRecruiter` is a no-op for company/admin callers (it always
 * reports approved for non-recruiters). */
function AuthedJobDetail({ jobId, role }: { jobId: string; role: string }) {
  return (
    <DashboardLayout wide="detail">
      <div className="flex w-full flex-col gap-4">
        <Link
          href="/explore-jobs"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to explore jobs
        </Link>
        <RequireApprovedRecruiter>
          <AuthedJobBody jobId={jobId} role={role} />
        </RequireApprovedRecruiter>
      </div>
    </DashboardLayout>
  );
}

/**
 * Guest view: the public job-detail endpoint is gone, so a signed-out visitor
 * is never shown job data (title, company, fee) here — just the marketing
 * shell and a sign-up CTA, reusing the same card chrome and CTA button this
 * page already used for its "role no longer available" and recruiter sign-up
 * states.
 */
function GuestJobDetail() {
  return (
    <PublicShell>
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-12 md:px-0">
        <Link
          href="/explore-jobs"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to explore jobs
        </Link>
        <div className="rounded-md border border-border bg-card p-10 text-center">
          <p className="font-heading text-lg font-extrabold text-navy">
            Sign up to view this job
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a recruiter account and get verified to see the role, the
            company and the recruiter fee, and to submit candidates.
          </p>
          <Button asChild className="mt-6 font-bold">
            <Link href="/signup">
              <Send className="h-[18px] w-[18px]" />
              Sign up as a recruiter
            </Link>
          </Button>
        </div>
      </div>
    </PublicShell>
  );
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const { status, user } = useAuth();

  // While the session boots, stay chrome-neutral — avoids a guest→dashboard
  // flash for signed-in visitors.
  if (status === "booting") {
    return (
      <div className="mx-auto max-w-5xl px-5 py-16">
        <DetailSkeleton />
      </div>
    );
  }

  if (status === "authenticated" && user) {
    return <AuthedJobDetail jobId={params.id} role={user.role} />;
  }
  return <GuestJobDetail />;
}
