import { useCompanyApprovalGate } from "@/features/companies";
import { useVerificationGate } from "@/features/recruiters";

/**
 * "May this account use the marketplace?", for either role.
 *
 * The two gates stay separate features — each owns its own profile query and
 * its own banner — but chrome shared by both roles (the sidebar, the user
 * menu) needs one answer. Both hooks run unconditionally, as hooks must; each
 * only fetches for its own role, so the other is inert.
 */
export function useAccountApproval(): { isApproved: boolean } {
  const recruiter = useVerificationGate();
  const company = useCompanyApprovalGate();
  return { isApproved: recruiter.isApproved && company.isApproved };
}
