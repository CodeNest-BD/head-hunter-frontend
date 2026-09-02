import { Building2, UserSearch, type LucideIcon } from "lucide-react";
import type { SignupRole } from "../types";

interface SignupRoleDetail {
  label: string;
  hint: string;
  blurb: string;
  icon: LucideIcon;
}

/** Card order in the first sign-up step; the details keyed lookup below is the
 * copy shared by that step and the summary on the form step. */
export const SIGNUP_ROLE_ORDER: ReadonlyArray<SignupRole> = [
  "company",
  "recruiter",
];

export const SIGNUP_ROLE_DETAILS: Record<SignupRole, SignupRoleDetail> = {
  company: {
    label: "Company",
    hint: "Hire Talent",
    blurb:
      "Post roles, review submissions, and hire through vetted recruiters.",
    icon: Building2,
  },
  recruiter: {
    label: "Recruiter",
    hint: "Find placements",
    blurb:
      "Find open roles, submit your candidates, and get paid on placement.",
    icon: UserSearch,
  },
};
