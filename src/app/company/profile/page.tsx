"use client";

import { AlertCircle } from "lucide-react";

import { AccountSection, RequireRole } from "@/features/auth";
import {
  CompanyApprovalBanner,
  CompanyEmployeeInfoForm,
  CompanyProfileForm,
  useMyCompanyProfile,
  type VerificationStatus,
} from "@/features/companies";
import { PageBanner } from "@/shared/ui-components/brand";
import { Button } from "@/shared/ui-components/controls/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui-components/controls/tabs";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

function ProfileSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="h-96 w-full animate-pulse rounded-md border border-border/70 bg-muted" />
      <div className="h-56 w-full animate-pulse rounded-md border border-border/70 bg-muted" />
    </div>
  );
}

/** What the banner pill says about the company's standing with recruiters. */
const APPROVAL_PILL: Record<
  VerificationStatus,
  { dot: string; label: string }
> = {
  verified: { dot: "bg-emerald-400", label: "Visible to Recruiters" },
  pending: { dot: "bg-amber-400", label: "Awaiting Approval" },
  rejected: { dot: "bg-red-400", label: "Approval Declined" },
};

function CompanyProfileContent() {
  const { data, isPending, isError, refetch } = useMyCompanyProfile();

  return (
    <div className="flex flex-col gap-6">
      <PageBanner
        title="Company Profile"
        accentPeriod={false}
        subtitle="This is what recruiters see when they browse companies."
        actions={
          data ? (
            <span className="inline-flex items-center gap-2 text-sm font-medium text-navy/70">
              <span
                className={`h-2 w-2 rounded-full ${APPROVAL_PILL[data.verificationStatus].dot}`}
              />
              {APPROVAL_PILL[data.verificationStatus].label}
            </span>
          ) : null
        }
      />

      {/* The profile page is the server's allow-list surface, so this is where
          an unapproved company reads the admin's note and can re-apply. */}
      <CompanyApprovalBanner />

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
