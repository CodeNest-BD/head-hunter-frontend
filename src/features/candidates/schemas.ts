import { z } from "zod";

import { serialNumberSchema } from "@/shared/utils/entityPaths";
import { MAX_SALARY_MAJOR, MAX_SALARY_MAJOR_LABEL } from "@/shared/utils/money";

export const CANDIDATE_STATUSES = [
  "submitted",
  "reviewing",
  "interviewing",
  "offered",
  "hired",
  "passed",
] as const;
export const candidateStatusSchema = z.enum(CANDIDATE_STATUSES);
export type CandidateStatus = z.infer<typeof candidateStatusSchema>;

export const CANDIDATE_STATUS_LABELS: Record<CandidateStatus, string> = {
  submitted: "Submitted",
  reviewing: "Reviewing",
  interviewing: "Interviewing",
  offered: "Offered",
  hired: "Hired",
  passed: "Passed",
};

/**
 * The given values narrowed to real candidate statuses, in pipeline order.
 *
 * One helper because two callers need it and both must agree: the inbox's
 * stage filter hands back `string[]`, and a `?status=` URL can say anything.
 * Narrowed by membership rather than asserted, so a stale link or a hand-typed
 * value is dropped instead of being sent to an API that would reject it.
 */
export function toCandidateStatuses(
  values: readonly string[],
): CandidateStatus[] {
  return CANDIDATE_STATUSES.filter((status) => values.includes(status));
}

/**
 * The stages a candidate is still live at — everything but the two endings.
 *
 * One definition because two things have to agree about it: the recruiter
 * dashboard's "Candidates In Process" figure, and the inbox filter that card
 * links to. When they were written separately the card counted a hired
 * candidate and the list did not, which is the mismatch the client reported.
 * Ordered as a candidate moves through them, so a filter menu reads as a
 * pipeline rather than an alphabet.
 */
export const IN_PROCESS_CANDIDATE_STATUSES = [
  "submitted",
  "reviewing",
  "interviewing",
  "offered",
] as const satisfies readonly CandidateStatus[];

export const candidateSchema = z.object({
  id: z.string(),
  serialNumber: serialNumberSchema.optional(),
  jobId: z.string(),
  recruiterProfileId: z.string(),
  fullName: z.string(),
  // Both nullable: the submit form stopped collecting either, so only
  // candidates submitted before that carry them. Shown to the submitting
  // recruiter alone, never to the hiring company.
  email: z.string().nullable().catch(null),
  phone: z.string().nullable().catch(null),
  overview: z.string().nullable(),
  /** The recruiter's pitch to the company; it opens the candidate's thread. */
  pitch: z.string().nullable(),
  linkedinUrl: z.string().nullable(),
  yearsOfExperience: z.number().nullable(),
  currentCompany: z.string().nullable(),
  expectedSalaryMinor: z.number().nullable(),
  noticePeriodDays: z.number().nullable(),
  status: candidateStatusSchema,
  createdAt: z.coerce.date(),
});
export type Candidate = z.infer<typeof candidateSchema>;

/**
 * Candidate submit/edit form. Strings throughout; converted to the wire shape
 * (numbers, cents, null-for-cleared) at the submit boundary — mirrors
 * recruiterProfileFormSchema / companyProfileFormSchema.
 */
export const candidateFormSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  // No `email` or `phone`: the form stopped collecting either, so a direct
  // line to a candidate only exists on records that already had one.
  // `Candidate.email`/`.phone` above stay — older submissions carry them, and
  // the submitting recruiter's own panel still shows them.
  //
  // Rich-text HTML from `RichTextEditor`, sanitized at the submit boundary.
  // Not `.trim()`: an editor's value is markup, and trimming it would be
  // measuring the wrong thing — `isRichTextEmpty` decides what counts as blank.
  overview: z.string(),
  linkedinUrl: z
    .string()
    .trim()
    .url("Enter a full URL, including https://")
    .or(z.literal("")),
  // Half-years count: "2.5 years" is a real claim, so one decimal place is
  // allowed — matching the backend column's numeric(4,1).
  yearsOfExperience: z
    .string()
    .trim()
    .refine(
      (v) =>
        v === "" ||
        (Number.isFinite(Number(v)) &&
          Number(v) >= 0 &&
          Number(v) <= 60 &&
          Number.isInteger(Number(v) * 10)),
      { message: "Enter years between 0 and 60, to at most one decimal" },
    ),
  currentCompany: z.string().trim(),
  expectedSalary: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 0),
      { message: "Enter a whole amount of 0 or more" },
    )
    .refine((v) => v === "" || Number(v) <= MAX_SALARY_MAJOR, {
      message: `Expected salary must be under ${MAX_SALARY_MAJOR_LABEL}`,
    }),
  noticePeriodDays: z
    .string()
    .trim()
    .refine(
      (v) =>
        v === "" ||
        (Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 365),
      { message: "Enter a whole number of days between 0 and 365" },
    ),
});
export type CandidateFormValues = z.infer<typeof candidateFormSchema>;

export const attachmentSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  contentType: z.string().nullable(),
  sizeBytes: z.number().nullable(),
  downloadUrl: z.string(),
  previewUrl: z.string().optional(),
  createdAt: z.coerce.date(),
});
export type Attachment = z.infer<typeof attachmentSchema>;
