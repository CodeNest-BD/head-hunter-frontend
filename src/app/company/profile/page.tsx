"use client";

import { AccountCard, RequireRole } from "@/features/auth";
import {
  CompanyApprovalBanner,
  CompanyEmployeeInfoForm,
  CompanyProfileForm,
  useMyCompanyProfile,
  type VerificationStatus,
} from "@/features/companies";
import { Pill, type PillTone } from "@/shared/ui-components/badges/Pill";
import { PageHeader } from "@/shared/ui-components/brand";
import { ErrorRetryCallout } from "@/shared/ui-components/feedback/ErrorRetryCallout";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";
import { SettingsLayout } from "@/shared/ui-components/layout/SettingsLayout";

function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="h-96 w-full animate-pulse rounded-md bg-surface-sub shadow-e1" />
      <div className="h-56 w-full animate-pulse rounded-md bg-surface-sub shadow-e1" />
    </div>
  );
}

/** What the banner pill says about the company's standing with recruiters. */
const APPROVAL_PILL: Record<
  VerificationStatus,
  { tone: PillTone; label: string }
> = {
  verified: { tone: "ok", label: "Visible to Recruiters" },
  pending: { tone: "warn", label: "Awaiting Approval" },
  rejected: { tone: "bad", label: "Approval Declined" },
};

function CompanySettingsContent() {
  const { data, isPending, isError, refetch } = useMyCompanyProfile();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Settings"
        subtitle="The profile recruiters see, and your own contact and sign-in details."
        actions={
          data ? (
            <Pill tone={APPROVAL_PILL[data.verificationStatus].tone}>
              {APPROVAL_PILL[data.verificationStatus].label}
            </Pill>
          ) : null
        }
      />

      {/* The profile page is the server's allow-list surface, so this is where
          an unapproved company reads the admin's note and can re-apply. */}
      <CompanyApprovalBanner />

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
              id: "company",
              label: "Company Profile",
              content: <CompanyProfileForm profile={data} />,
            },
            {
              id: "contact",
              label: "Your Details",
              content: <CompanyEmployeeInfoForm profile={data} />,
            },
            { id: "account", label: "Account", content: <AccountCard /> },
          ]}
        />
      )}
    </div>
  );
}

export default function CompanyProfilePage() {
  return (
    <RequireRole role="company">
      <DashboardLayout>
        <CompanySettingsContent />
      </DashboardLayout>
    </RequireRole>
  );
}
