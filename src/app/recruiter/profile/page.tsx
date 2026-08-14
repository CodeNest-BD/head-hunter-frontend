"use client";

import { AlertCircle } from "lucide-react";

import { RequireRole } from "@/features/auth";
import {
  RecruiterProfileForm,
  ReferencesSection,
  SubscriptionCard,
  useMyRecruiterProfile,
} from "@/features/recruiters";
import { PageHeader } from "@/shared/ui-components/brand";
import { Button } from "@/shared/ui-components/controls/button";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="h-24 w-full animate-pulse rounded-xl border border-border/70 bg-muted" />
      <div className="flex flex-col gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

function RecruiterProfileContent() {
  const { data, isPending, isError, refetch } = useMyRecruiterProfile();

  if (isPending) {
    return <ProfileSkeleton />;
  }
  if (isError) {
    return (
      <div className="flex max-w-md flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
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
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <SubscriptionCard profile={data} />
      <div className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
        <RecruiterProfileForm profile={data} />
      </div>
      <ReferencesSection references={data.references} />
    </div>
  );
}

export default function RecruiterProfilePage() {
  return (
    <RequireRole role="recruiter">
      <DashboardLayout>
        <div className="flex max-w-2xl flex-col gap-8">
          <PageHeader
            title="Recruiter profile"
            subtitle="Your details, specializations and references."
          />
          <RecruiterProfileContent />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
