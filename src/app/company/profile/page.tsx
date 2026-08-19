"use client";

import { AlertCircle } from "lucide-react";

import { RequireRole } from "@/features/auth";
import { CompanyProfileForm, useMyCompanyProfile } from "@/features/companies";
import { PageHeader } from "@/shared/ui-components/brand";
import { Button } from "@/shared/ui-components/controls/button";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

function ProfileSkeleton() {
  return (
    <div className="flex max-w-2xl flex-col gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
        </div>
      ))}
    </div>
  );
}

function CompanyProfileContent() {
  const { data, isPending, isError, refetch } = useMyCompanyProfile();

  if (isPending) {
    return <ProfileSkeleton />;
  }
  if (isError) {
    return (
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
    );
  }
  return <CompanyProfileForm profile={data} />;
}

export default function CompanyProfilePage() {
  return (
    <RequireRole role="company">
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <PageHeader
            title="Company profile"
            subtitle="This is what recruiters see when they browse companies."
          />
          <CompanyProfileContent />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
