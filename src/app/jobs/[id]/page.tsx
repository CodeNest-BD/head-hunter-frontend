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

import { useAuth } from "@/features/auth";
import {
  EMPLOYMENT_TYPE_LABELS,
  ROLE_CATEGORY_LABELS,
  useJob,
  usePublicJob,
} from "@/features/jobs";
import { useIsVerifiedRecruiter } from "@/features/recruiters";
import { useCreateOrOpenSubmission } from "@/features/submissions";
import { PublicShell } from "@/components/landing/PublicShell";
import { PageHeader } from "@/shared/ui-components/brand";
import { Button } from "@/shared/ui-components/controls/button";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatMinor } from "@/shared/utils/money";
import { RichTextView } from "@/shared/ui-components/data/RichTextView";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";
import type { LucideIcon } from "lucide-react";
import type { EmploymentType, RoleCategory } from "@/features/jobs";

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
        "flex items-start gap-3 rounded-md border border-brand-line bg-card p-3.5",
        className,
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
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

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-28 w-full animate-pulse rounded-md border border-border/70 bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-20 w-full animate-pulse rounded-md bg-muted"
          />
        ))}
      </div>
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

function JobBody({ job, cta }: { job: JobView; cta: React.ReactNode }) {
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
  // How stale a role is changes whether a recruiter works it, so this is
  // relative rather than an absolute date.
  const posted = job.publishedAt
    ? formatDistanceToNow(job.publishedAt, { addSuffix: true })
    : "—";
  const category =
    ROLE_CATEGORY_LABELS[job.roleCategory as RoleCategory] ?? "Other";

  return (
    <div className="flex flex-col gap-5">
      {cta && <div className="flex justify-end">{cta}</div>}

      {/* Recruiter fee hero — the headline number, with a soft brand glow. */}
      <div className="relative overflow-hidden rounded-md border border-primary/30 bg-card p-5 shadow-sm">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl"
        />
        <div className="relative flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
            <Wallet className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Recruiter fee</p>
            <p className="font-heading text-[28px] font-extrabold leading-tight tracking-tight tabular-nums text-navy">
              {formatMinor(job.recruiterFeeMinor)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Paid upon a successful hire.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Detail icon={Briefcase} label="Category" value={category} />
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
        <section className="rounded-md border border-brand-line bg-card p-5 shadow-sm">
          <h2 className="mb-3 font-heading text-lg font-semibold tracking-tight text-foreground">
            Description
          </h2>
          <RichTextView value={job.description} />
        </section>
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

function RecruiterCta({ jobId }: { jobId: string }) {
  const { isVerified, verificationStatus, isLoading } =
    useIsVerifiedRecruiter();
  if (isLoading) return null;
  if (isVerified) return <SubmitCandidatesButton jobId={jobId} />;
  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button type="button" disabled>
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

/** Signed-in view: authed endpoint (role visibility rules), dashboard chrome. */
function AuthedJobDetail({ jobId, role }: { jobId: string; role: string }) {
  const { data: job, isPending, isError, refetch } = useJob(jobId);

  return (
    <DashboardLayout>
      <div className="flex max-w-2xl flex-col gap-6">
        <Link
          href="/explore-jobs"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to explore jobs
        </Link>
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
      </div>
    </DashboardLayout>
  );
}

/** Guest view: public endpoint, marketing chrome, sign-up CTA. */
function GuestJobDetail({ jobId }: { jobId: string }) {
  const { data: job, isPending, isError } = usePublicJob(jobId);

  return (
    <PublicShell>
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-12 md:px-0">
        <Link
          href="/explore-jobs"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to explore jobs
        </Link>
        {isPending ? (
          <DetailSkeleton />
        ) : isError || !job ? (
          <div className="rounded-md border border-brand-line bg-white p-10 text-center">
            <p className="font-heading text-lg font-extrabold text-navy">
              This role is no longer available
            </p>
            <p className="mt-2 text-sm text-brand-gray">
              It may have been filled or expired.{" "}
              <Link
                href="/explore-jobs"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Browse open jobs
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            <div>
              <h1 className="font-heading text-3xl font-extrabold tracking-[-0.02em] text-navy">
                {job.title}
              </h1>
              {job.companyName && (
                <p className="mt-1 text-brand-gray">{job.companyName}</p>
              )}
            </div>
            <JobBody
              job={job}
              cta={
                <Button asChild className="font-bold">
                  <Link href="/signup">
                    <Send className="h-[18px] w-[18px]" />
                    Sign up to submit candidates
                  </Link>
                </Button>
              }
            />
          </>
        )}
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
      <div className="mx-auto max-w-2xl px-5 py-16">
        <DetailSkeleton />
      </div>
    );
  }

  if (status === "authenticated" && user) {
    return <AuthedJobDetail jobId={params.id} role={user.role} />;
  }
  return <GuestJobDetail jobId={params.id} />;
}
