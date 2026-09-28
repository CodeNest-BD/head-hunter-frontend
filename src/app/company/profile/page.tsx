"use client";

import { AccountSection, RequireRole } from "@/features/auth";
import {
  CompanyApprovalBanner,
  CompanyEmployeeInfoForm,
  CompanyProfileForm,
  useMyCompanyProfile,
  type VerificationStatus,
} from "@/features/companies";
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

function ProfileSkeleton() {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="h-96 w-full animate-pulse rounded-md border border-line bg-surface-sub" />
      <div className="h-56 w-full animate-pulse rounded-md border border-line bg-surface-sub" />
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

function CompanyProfileContent() {
  const { data, isPending, isError, refetch } = useMyCompanyProfile();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Company Profile"
        subtitle="This is what recruiters see when they browse companies."
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
        <ProfileSkeleton />
      ) : isError ? (
        <ErrorRetryCallout
          message="Could not load your profile."
          onRetry={() => void refetch()}
        />
      ) : (
        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info">Company Info</TabsTrigger>
            <TabsTrigger value="employee">User Info</TabsTrigger>
            <TabsTrigger value="password">Password Change</TabsTrigger>
          </TabsList>
          <TabsContent value="info">
            <CompanyProfileForm profile={data} />
          </TabsContent>
          <TabsContent value="employee">
            <CompanyEmployeeInfoForm profile={data} />
          </TabsContent>
          <TabsContent value="password">
            <AccountSection />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default function CompanyProfilePage() {
  return (
    <RequireRole role="company">
      <DashboardLayout>
        <CompanyProfileContent />
      </DashboardLayout>
    </RequireRole>
  );
}
