"use client";

// The barrel is a client boundary: it re-exports hooks and components that
// use client-only React APIs, so a Server Component importing this file must
// not pull them into the server graph.
/**
 * Public surface of the companies feature. Import from "@/features/companies"
 * only — everything under api/, hooks/ and components/ is internal and may be
 * restructured without touching consumers.
 */
export { CompanyList } from "./components/CompanyList";
export { CompanyProfileForm } from "./components/CompanyProfileForm";
export { FollowButton } from "./components/FollowButton";
export { useMyCompanyProfile } from "./hooks/useCompanyProfile";
export {
  useCompanies,
  useFollowedCompanies,
  useToggleFollow,
} from "./hooks/useCompanies";
export { companyKeys } from "./keys";
export type { CompanyProfile, CompanySummary } from "./schemas";
