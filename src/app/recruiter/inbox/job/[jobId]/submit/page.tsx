"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { RequireApprovedRecruiter, RequireRole } from "@/features/auth";
import { CandidateForm } from "@/features/candidates";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

/**
 * Submitting a candidate is its own page rather than a panel above the list:
 * the form is long enough to scroll on its own, and stacking it over the
 * list's search bar and empty state left the reader looking at two unrelated
 * things at once.
 */
export default function SubmitCandidatePage() {
  const params = useParams<{ jobId: string }>();
  const router = useRouter();
  const listHref = `/recruiter/inbox/job/${params.jobId}`;

  return (
    <RequireRole role="recruiter">
      <DashboardLayout>
        <RequireApprovedRecruiter>
          <div className="flex w-full flex-col gap-6">
            <Link
              href={listHref}
              className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to your candidates
            </Link>
            <PageHeader
              title="Submit a candidate"
              subtitle="They get their own conversation with the company as soon as you send them."
              className="mb-0"
            />
            <div className="flex flex-col gap-4 rounded-md border border-border/70 bg-card p-5 shadow-sm">
              <CandidateForm
                jobId={params.jobId}
                onDone={() => router.push(listHref)}
                onCancel={() => router.push(listHref)}
              />
            </div>
          </div>
        </RequireApprovedRecruiter>
      </DashboardLayout>
    </RequireRole>
  );
}
