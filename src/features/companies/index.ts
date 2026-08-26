"use client";

// The barrel is a client boundary: it re-exports hooks and components that
// use client-only React APIs, so a Server Component importing this file must
// not pull them into the server graph.
/**
 * Public surface of the companies feature. Import from "@/features/companies"
 * only — everything under api/, hooks/ and components/ is internal and may be
 * restructured without touching consumers.
 */
export { CompanyApprovalBanner } from "./components/CompanyApprovalBanner";
export { CompanyEmployeeInfoForm } from "./components/CompanyEmployeeInfoForm";
export { CompanyList } from "./components/CompanyList";
export { CompanyProfileForm } from "./components/CompanyProfileForm";
export { useCompanyApprovalGate } from "./hooks/useCompanyApprovalGate";
export {
  useMyCompanyProfile,
  useReapplyCompanyVerification,
} from "./hooks/useCompanyProfile";
export { useCompanies } from "./hooks/useCompanies";
export { companyKeys } from "./keys";
export type {
  CompanyProfile,
  CompanySummary,
  VerificationStatus,
} from "./schemas";
