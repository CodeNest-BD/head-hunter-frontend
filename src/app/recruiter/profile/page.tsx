"use client";

import { AlertCircle } from "lucide-react";

import { AccountSection, RequireRole } from "@/features/auth";
import {
  RecruiterProfileForm,
  ReferencesSection,
  useMyRecruiterProfile,
  VerificationBanner,
  type VerificationStatus,
} from "@/features/recruiters";
import { PageBanner } from "@/shared/ui-components/brand";
import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

const VERIFICATION_PILL: Record<
  VerificationStatus,
  { dot: string; label: string }
> = {
  verified: { dot: "bg-emerald-400", label: "Verified recruiter" },
  pending: { dot: "bg-amber-400", label: "Pending verification" },
  rejected: { dot: "bg-red-400", label: "Verification declined" },
};

function VerificationPill({ status }: { status: VerificationStatus }) {
  const { dot, label } = VERIFICATION_PILL[status];
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-white/80">
      <span className={cn("h-2 w-2 rounded-full", dot)} />
      {label}
    </span>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="h-56 w-full animate-pulse rounded-md border border-border/70 bg-muted" />
      <div className="h-40 w-full animate-pulse rounded-md border border-border/70 bg-muted" />
    </div>
  );
}

function RecruiterProfileContent() {
  const { data, isPending, isError, refetch } = useMyRecruiterProfile();

  return (
    <div className="flex flex-col gap-6">
      <PageBanner
        title="Recruiter profile"
        subtitle="Your details, specializations and references."
        actions={
          data ? <VerificationPill status={data.verificationStatus} /> : null
        }
      />

      <VerificationBanner />

      {isPending ? (
        <ProfileSkeleton />
      ) : isError ? (
        <div className="flex max-w-md flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-[18px] w-[18px]" />
            Could not load your profile.
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
        <>
          <RecruiterProfileForm profile={data} />
          <ReferencesSection references={data.references} />
          <AccountSection />
        </>
      )}
    </div>
  );
}

export default function RecruiterProfilePage() {
  return (
    <RequireRole role="recruiter">
      <DashboardLayout>
        <div className="w-full">
          <RecruiterProfileContent />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
