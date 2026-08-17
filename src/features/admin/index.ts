"use client";

// The barrel is a client boundary: it re-exports client-only components/hooks.
export { AdminOverview } from "./components/AdminOverview";
export { RecruitersTable } from "./components/RecruitersTable";
export { CompaniesTable } from "./components/CompaniesTable";
export { ConversationsTable } from "./components/ConversationsTable";
export { RecruiterDetail } from "./components/RecruiterDetail";
export { CompanyDetail } from "./components/CompanyDetail";
export { ConversationThread } from "./components/ConversationThread";
export { JobsTable } from "./components/JobsTable";
export { MinFeeCard } from "./components/MinFeeCard";
export { RecruiterPricingCard } from "./components/RecruiterPricingCard";
export { AdminManagement } from "./components/AdminManagement";
export { HoldButton } from "./components/HoldButton";
export {
  useAdminRecruiters,
  useAdminCompanies,
  useAdminConversations,
  useAdminJobs,
  useDeleteRecruiter,
  useUpdateAdmin,
  useUpdateAdminJob,
} from "./hooks/useAdmin";
