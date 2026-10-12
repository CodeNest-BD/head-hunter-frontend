"use client";

import { AccountCard, RequireRole } from "@/features/auth";
import {
  RecruiterProfileForm,
  ReferencesSection,
  useMyRecruiterProfile,
  VerificationBanner,
  type VerificationStatus,
} from "@/features/recruiters";
import { Pill, type PillTone } from "@/shared/ui-components/badges/Pill";
import { PageHeader } from "@/shared/ui-components/brand";
import { ErrorRetryCallout } from "@/shared/ui-components/feedback/ErrorRetryCallout";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";
import { SettingsLayout } from "@/shared/ui-components/layout/SettingsLayout";

const VERIFICATION_PILL: Record<
  VerificationStatus,
  { tone: PillTone; label: string }
> = {
  verified: { tone: "ok", label: "Verified Recruiter" },
  pending: { tone: "warn", label: "Pending Verification" },
  rejected: { tone: "bad", label: "Verification Declined" },
};

function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="h-96 w-full animate-pulse rounded-md bg-surface-sub shadow-e1" />
      <div className="h-40 w-full animate-pulse rounded-md bg-surface-sub shadow-e1" />
    </div>
  );
}

function RecruiterSettingsContent() {
  const { data, isPending, isError, refetch } = useMyRecruiterProfile();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Settings"
        subtitle="The profile companies see, your references, and your sign-in details."
        actions={
          data ? (
            <Pill tone={VERIFICATION_PILL[data.verificationStatus].tone}>
              {VERIFICATION_PILL[data.verificationStatus].label}
            </Pill>
          ) : null
        }
      />

      <VerificationBanner />

      {isPending ? (
        <SettingsSkeleton />
      ) : isError ? (
        <ErrorRetryCallout
          message="Could not load your profile."
          onRetry={() => void refetch()}
        />
      ) : (
        <SettingsLayout
          sections={[
            {
              id: "profile",
              label: "Profile",
              content: <RecruiterProfileForm profile={data} />,
            },
            {
              id: "references",
              label: "References",
              content: <ReferencesSection references={data.references} />,
            },
            { id: "account", label: "Account", content: <AccountCard /> },
          ]}
        />
      )}
    </div>
  );
}

export default function RecruiterProfilePage() {
  return (
    <RequireRole role="recruiter">
      <DashboardLayout>
        <RecruiterSettingsContent />
      </DashboardLayout>
    </RequireRole>
  );
}
