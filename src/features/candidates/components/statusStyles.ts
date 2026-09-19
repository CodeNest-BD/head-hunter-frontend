import type { CandidateStatus } from "../schemas";

/** Candidate status pill colors (matches the app's light status palette). */
export const CANDIDATE_STATUS_STYLES: Record<CandidateStatus, string> = {
  submitted: "bg-primary/15 text-primary",
  reviewing: "text-[#92610C] bg-[#FBF3DF]",
  interviewing: "text-[#92610C] bg-[#FBF3DF]",
  offered: "text-[#17734E] bg-[#E7F4EC]",
  hired: "text-[#17734E] bg-[#E7F4EC]",
  // Red, matching the inbox list and the admin views: passed is an outcome,
  // not an absence of one.
  passed: "bg-[#FBEAEA] text-[#9B3535]",
};
