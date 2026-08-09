"use client";

// The barrel is a client boundary: it re-exports client-only components/hooks.
export { RecruitersTable } from "./components/RecruitersTable";
export { CompaniesTable } from "./components/CompaniesTable";
export { ConversationsTable } from "./components/ConversationsTable";
export { RecruiterDetail } from "./components/RecruiterDetail";
export { CompanyDetail } from "./components/CompanyDetail";
export { ConversationThread } from "./components/ConversationThread";
export { HoldButton } from "./components/HoldButton";
export {
  useAdminRecruiters,
  useAdminCompanies,
  useAdminConversations,
} from "./hooks/useAdmin";
