"use client";

// The barrel is a client boundary: it re-exports client-only components/hooks.
export { AdminOverview } from "./components/AdminOverview";
export { RecruitersTable } from "./components/RecruitersTable";
export { CompaniesTable } from "./components/CompaniesTable";
export { ConversationsBoard } from "./components/ConversationsBoard";
export { SubmissionsTable } from "./components/SubmissionsTable";
export { AdminJobDetail } from "./components/AdminJobDetail";
export { OffersPlacementsBoard } from "./components/OffersPlacementsBoard";
export { RecruiterDetail } from "./components/RecruiterDetail";
export { CompanyDetail } from "./components/CompanyDetail";
export { ConversationThread } from "./components/ConversationThread";
export { JobsTable } from "./components/JobsTable";
export { MinFeeCard } from "./components/MinFeeCard";
export { RecruiterPricingCard } from "./components/RecruiterPricingCard";
export { AdminManagement } from "./components/AdminManagement";
export {
  useAdminRecruiters,
  useAdminCompanies,
  useAdminConversations,
  useAdminJobs,
  useDeleteRecruiter,
  useRepostAdminJob,
  useUpdateAdmin,
  useUpdateAdminJob,
} from "./hooks/useAdmin";
export { CompanyPaymentsBoard } from "./components/CompanyPaymentsBoard";
export { RecruiterPayoutsBoard } from "./components/RecruiterPayoutsBoard";
export { AdminPayoutDetail } from "./components/AdminPayoutDetail";
