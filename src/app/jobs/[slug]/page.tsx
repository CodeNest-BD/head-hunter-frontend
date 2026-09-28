"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { AlertCircle, ChevronLeft, Send, SquarePen } from "lucide-react";

import { RequireApprovedRecruiter, useAuth } from "@/features/auth";
import { useJob, usePublishJob } from "@/features/jobs";
import type { Job } from "@/features/jobs/schemas";
import { useMyCompanyProfile } from "@/features/companies";
import { JobDetailBody } from "@/features/jobs/components/JobDetailView";
import { jobIdFromSlug, jobPath } from "@/features/jobs/utils/jobPath";
import { jobToJobView } from "@/features/jobs/utils/toJobView";
import { useIsVerifiedRecruiter } from "@/features/recruiters";
import { PublicShell } from "@/components/landing/PublicShell";
import { HIDE_PHASE2_FEATURES } from "@/shared/config/featureFlags";
import { BackLink, PageHeader } from "@/shared/ui-components/brand";
import { Button } from "@/shared/ui-components/controls/button";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-28 w-full animate-pulse rounded-md border border-line bg-surface-sub" />
      <div className="h-80 w-full animate-pulse rounded-md border border-line bg-surface-sub" />
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
  // Candidate submission is phase-2 — disable the button for the phase-1
  // delivery (see HIDE_PHASE2_FEATURES / docs/phase-1-hidden-features.md).
  if (HIDE_PHASE2_FEATURES) {
    return (
      <Button type="button" className="w-full" disabled>
        <Send className="size-[15px]" />
        Submit candidates
      </Button>
    );
  }
  // Sending a candidate IS the act that puts a recruiter on a job now, so
  // there is nothing to "open" first — this goes straight to the job's
  // candidate list, where the form to add one lives.
  return (
    <Button asChild type="button" className="w-full">
      <Link href={`/recruiter/inbox/job/${jobId}`}>
        <Send className="size-[15px]" />
        Submit candidates
      </Link>
    </Button>
  );
}

/**
 * Edit and Publish, for the company that owns this job. Gated on the viewer's
 * own profile id rather than their role: recruiters and admins reach this page
 * too, and must never get edit controls on somebody else's listing. Publish
 * only shows while the job is a draft — the one status change made here.
 */
function CompanyJobActions({ job }: { job: Job }) {
  const { data: profile } = useMyCompanyProfile();
  const { publish, isPending } = usePublishJob(job);

  if (!profile || profile.id !== job.companyProfileId) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild type="button" variant="outline" size="sm">
        <Link href={`/company/jobs/${job.id}`}>
          <SquarePen className="size-[15px]" />
          Edit
        </Link>
      </Button>
      {job.status === "draft" && (
        <Button type="button" size="sm" disabled={isPending} onClick={publish}>
          {isPending ? "Publishing…" : "Publish job"}
        </Button>
      )}
    </div>
  );
}

function RecruiterCta({ jobId }: { jobId: string }) {
  const { isVerified, verificationStatus, isLoading } =
    useIsVerifiedRecruiter();
  // Hold the button's footprint: this CTA leads the job's sidebar, and popping
  // it in after the verification query lands shoves everything below it down.
  if (isLoading) {
    return (
      <div
        aria-hidden="true"
        className="h-9 w-full animate-pulse rounded-sm bg-surface-sunken"
      />
    );
  }
  if (isVerified) return <SubmitCandidatesButton jobId={jobId} />;
  return (
    <div className="flex flex-col gap-1.5">
      <Button type="button" className="w-full" disabled>
        <Send className="size-[15px]" />
        Submit candidates
      </Button>
      <p className="text-meta text-ink-muted">
        {verificationStatus === "rejected"
          ? "Your verification was declined — see your "
          : "Submitting unlocks once you're verified — check your "}
        <Link
          href="/recruiter/profile"
          className="font-[550] text-blue-ink underline-offset-2 hover:underline"
        >
          profile
        </Link>
        .
      </p>
    </div>
  );
}

/**
 * Rewrites a bare-uuid link, or one whose slug went stale after a rename, to
 * the job's current `/jobs/<slug>-<uuid>` — `replace` so Back doesn't bounce
 * through the old URL.
 */
function useCanonicalJobPath(job: Job | undefined): void {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!job) return;
    const canonical = jobPath(job);
    if (pathname !== canonical) router.replace(canonical);
  }, [job, pathname, router]);
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
  useCanonicalJobPath(job);

  return (
    <>
      <PageHeader
        title={job?.title ?? "Job detail"}
        subtitle="The fee, the role, and everything you need before you submit a candidate."
        actions={
          role === "company" && job ? <CompanyJobActions job={job} /> : null
        }
      />
      {isPending ? (
        <DetailSkeleton />
      ) : isError || !job ? (
        <div className="flex flex-col gap-3 rounded-sm border border-bad-line bg-bad-bg p-3.5 text-sub text-bad">
          <div className="flex items-center gap-2.5 font-[550]">
            <AlertCircle className="size-[15px] shrink-0" />
            Could not load this job. It may have expired or been closed.
          </div>
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
            >
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <JobDetailBody
          job={jobToJobView(job)}
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
  const router = useRouter();
  // A generic "Back" that returns wherever the viewer came from — the inbox,
  // the map, a search — rather than always the map. Falls back to the map when
  // there is no in-app history (a direct link or a hard refresh).
  const goBack = (): void => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/explore-jobs");
    }
  };

  return (
    <DashboardLayout wide="detail" hideSidebar>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        {/* `.backlink`, as a button: this one returns to wherever the viewer
            came from, so there is no href for the shared `BackLink`. */}
        <button
          type="button"
          onClick={goBack}
          className="-mb-2 inline-flex w-fit items-center gap-1.5 text-[12.5px] font-[550] text-ink-muted transition-colors hover:text-ink"
        >
          <ChevronLeft className="size-3.5" aria-hidden="true" />
          Back
        </button>
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
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-12 sm:px-5 md:px-0">
        <BackLink href="/explore-jobs" className="mb-0">
          Back to Live Map
        </BackLink>
        <div className="rounded-md border border-line bg-surface p-5 text-center shadow-e1 sm:p-10">
          <p className="text-section font-[650] text-ink">
            Sign up to view this job
          </p>
          <p className="mt-2 text-sub text-ink-muted">
            Create a recruiter account and get verified to see the role, the
            company and the recruiter fee, and to submit candidates.
          </p>
          <Button asChild className="mt-6 w-full sm:w-auto">
            <Link href="/signup">
              <Send className="size-[15px]" />
              Sign up as a recruiter
            </Link>
          </Button>
        </div>
      </div>
    </PublicShell>
  );
}

export default function JobDetailPage() {
  const params = useParams<{ slug: string }>();
  const { status, user } = useAuth();

  // While the session boots, stay chrome-neutral — avoids a guest→dashboard
  // flash for signed-in visitors.
  if (status === "booting") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-5">
        <DetailSkeleton />
      </div>
    );
  }

  if (status === "authenticated" && user) {
    return (
      <AuthedJobDetail jobId={jobIdFromSlug(params.slug)} role={user.role} />
    );
  }
  return <GuestJobDetail />;
}
