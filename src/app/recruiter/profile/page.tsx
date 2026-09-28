"use client";

import { AccountSection, RequireRole } from "@/features/auth";
import {
  RecruiterProfileForm,
  ReferencesSection,
  useMyRecruiterProfile,
  VerificationBanner,
  type VerificationStatus,
} from "@/features/recruiters";
import { Pill, type PillTone } from "@/shared/ui-components/badges/Pill";
import { PageHeader } from "@/shared/ui-components/brand";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui-components/controls/tabs";
import { ErrorRetryCallout } from "@/shared/ui-components/feedback/ErrorRetryCallout";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

const VERIFICATION_PILL: Record<
  VerificationStatus,
  { tone: PillTone; label: string }
> = {
  verified: { tone: "ok", label: "Verified Recruiter" },
  pending: { tone: "warn", label: "Pending Verification" },
  rejected: { tone: "bad", label: "Verification Declined" },
};

function VerificationPill({ status }: { status: VerificationStatus }) {
  const { tone, label } = VERIFICATION_PILL[status];
  return <Pill tone={tone}>{label}</Pill>;
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-56 w-full animate-pulse rounded-md border border-line bg-surface-sub" />
      <div className="h-40 w-full animate-pulse rounded-md border border-line bg-surface-sub" />
    </div>
  );
}

function RecruiterProfileContent() {
  const { data, isPending, isError, refetch } = useMyRecruiterProfile();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
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
        <ErrorRetryCallout
          message="Could not load your profile."
          onRetry={() => void refetch()}
        />
      ) : (
        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info">Personal Info</TabsTrigger>
            <TabsTrigger value="password">Password Change</TabsTrigger>
          </TabsList>
          <TabsContent value="info">
            <div className="flex flex-col gap-4">
              <RecruiterProfileForm profile={data} />
              <ReferencesSection references={data.references} />
            </div>
          </TabsContent>
          <TabsContent value="password">
            <AccountSection />
          </TabsContent>
        </Tabs>
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
