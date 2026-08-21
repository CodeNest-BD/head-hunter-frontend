"use client";

import dynamic from "next/dynamic";

import { RequireApprovedRecruiter, useAuth } from "@/features/auth";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

// Each role's dashboard is a heavy composite (it pulls in that role's feature
// graph). Code-split them so /dashboard only loads the one it renders, instead
// of bundling all three — and their whole feature graphs — into one route.
const RecruiterDashboard = dynamic(() =>
  import("@/features/recruiters/components/RecruiterDashboard").then(
    (mod) => mod.RecruiterDashboard,
  ),
);
const CompanyDashboard = dynamic(() =>
  import("@/features/companies/components/CompanyDashboard").then(
    (mod) => mod.CompanyDashboard,
  ),
);
const AdminOverview = dynamic(() =>
  import("@/features/admin").then((mod) => mod.AdminOverview),
);

function DashboardContent() {
  const { user } = useAuth();

  // AuthProvider gates this route: it renders nothing here until the session is
  // authenticated, so `user` is expected to be present. Guard anyway to keep
  // the type honest during the redirect frame.
  if (!user) return null;

  if (user.role === "recruiter") {
    return (
      <RequireApprovedRecruiter>
        <RecruiterDashboard firstName={user.firstName} />
      </RequireApprovedRecruiter>
    );
  }
  if (user.role === "company") {
    return <CompanyDashboard firstName={user.firstName} />;
  }
  return <AdminOverview firstName={user.firstName} />;
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
