"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Briefcase,
  CalendarDays,
  Clock,
  MapPin,
  Send,
  Wallet,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { RequireRole } from "@/features/auth";
import {
  EMPLOYMENT_TYPE_LABELS,
  ROLE_CATEGORY_LABELS,
  useJob,
} from "@/features/jobs";
import { useCreateOrOpenSubmission } from "@/features/submissions";
import { PageHeader } from "@/shared/ui-components/brand";
import { Button } from "@/shared/ui-components/controls/button";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatMinor } from "@/shared/utils/money";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";
import type { LucideIcon } from "lucide-react";

function Detail({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-border/60 bg-card p-4",
        className,
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="truncate font-medium text-foreground">{value}</span>
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-28 w-full animate-pulse rounded-xl border border-border/70 bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-20 w-full animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    </div>
  );
}

/**
 * The page's single call to action. It opens the submission-scoped workspace,
 * which is where candidates are submitted AND where the thread with the company
 * lives — so this one button serves both intents, and there is deliberately no
 * separate "message company" action beside it.
 *
 * `useCreateOrOpenSubmission` needs only a `jobId`, so a recruiter can open the
 * thread and start talking before submitting anyone.
 */
function SubmitCandidatesButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const createOrOpenSubmission = useCreateOrOpenSubmission();

  return (
    <Button
      type="button"
      disabled={createOrOpenSubmission.isPending}
      onClick={() =>
        createOrOpenSubmission.mutate(
          { jobId },
          {
            onSuccess: (submission) =>
              router.push(`/recruiter/submissions/${submission.id}`),
          },
        )
      }
    >
      <Send className="h-[18px] w-[18px]" />
      {createOrOpenSubmission.isPending ? "Opening…" : "Submit candidates"}
    </Button>
  );
}

function JobDetailContent({ jobId }: { jobId: string }) {
  const { data: job, isPending, isError, error, refetch } = useJob(jobId);

  if (isPending) {
    return <FormSkeleton />;
  }
  if (isError) {
    // The most likely cause is the subscription paywall, so say so rather than
    // showing a bare failure.
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive">
        <div className="flex items-center gap-2 font-medium">
          <AlertCircle className="h-[18px] w-[18px]" />
          Could not load this job.
          {(error as Error | undefined)?.message
            ? ` ${(error as Error).message}`
            : ""}
        </div>
        <p className="text-destructive/90">
          If you are not subscribed yet, activate your subscription on your{" "}
          <Link
            href="/recruiter/profile"
            className="font-medium underline underline-offset-2"
          >
            profile
          </Link>
          .
        </p>
        <button
          type="button"
          className="self-start rounded-md border border-destructive/40 px-3 py-1 text-xs font-medium transition-colors hover:bg-destructive/10"
          onClick={() => void refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  const location = job.isRemote
    ? "Remote"
    : [job.locationCity, job.locationState].filter(Boolean).join(", ") || "—";
  const salary =
    job.salaryMinMinor === null && job.salaryMaxMinor === null
      ? "—"
      : `${formatMinor(job.salaryMinMinor)} – ${formatMinor(job.salaryMaxMinor)}`;
  const employmentType = job.employmentType
    ? EMPLOYMENT_TYPE_LABELS[job.employmentType]
    : "—";
  // How stale a role is changes whether a recruiter works it, so this is
  // relative rather than an absolute date. `publishedAt` is null only for a job
  // that was never published, which a recruiter cannot reach from the job map.
  const posted = job.publishedAt
    ? formatDistanceToNow(job.publishedAt, { addSuffix: true })
    : "—";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <SubmitCandidatesButton jobId={jobId} />
      </div>

      {/* Recruiter fee hero — the headline number, with a soft brand glow. */}
      <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-card p-6 shadow-sm">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl"
        />
        <div className="relative flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Wallet className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Recruiter fee</p>
            <p className="font-heading text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
              {formatMinor(job.recruiterFeeMinor)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Paid on a successful hire, after the 30-day guarantee.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Detail
          icon={Briefcase}
          label="Category"
          value={ROLE_CATEGORY_LABELS[job.roleCategory]}
        />
        <Detail icon={MapPin} label="Location" value={location} />
        <Detail icon={Banknote} label="Salary range" value={salary} />
        <Detail icon={Clock} label="Employment type" value={employmentType} />
        <Detail
          icon={CalendarDays}
          label="Posted"
          value={posted}
          className="sm:col-span-2"
        />
      </div>

      {job.description && (
        <section className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
          <h2 className="mb-3 font-heading text-lg font-semibold tracking-tight text-foreground">
            Description
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {job.description}
          </p>
        </section>
      )}
    </div>
  );
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  // Same query key as JobDetailContent's, so TanStack serves both subscribers
  // from one request. Read here only for the heading: the role's name belongs in
  // the page title, and it falls back while loading or if the fetch fails.
  const { data: job } = useJob(params.id);

  return (
    <RequireRole role="recruiter">
      <DashboardLayout>
        <div className="flex max-w-2xl flex-col gap-6">
          <Link
            href="/jobs"
            className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to job map
          </Link>
          <PageHeader
            title={job?.title ?? "Job detail"}
            subtitle="The fee, the role, and everything you need before you submit a candidate."
            className="mb-0"
          />
          <JobDetailContent jobId={params.id} />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
