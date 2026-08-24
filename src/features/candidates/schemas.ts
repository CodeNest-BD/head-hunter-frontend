import { z } from "zod";

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

export const CV_ACCEPT = ".pdf,.doc,.docx";
export const CV_CONTENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;
export const MAX_CV_BYTES = 10 * 1024 * 1024;

export const candidateSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  recruiterProfileId: z.string(),
  fullName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
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
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  phone: z.string().trim(),
  overview: z.string().trim(),
  linkedinUrl: z
    .string()
    .trim()
    .url("Enter a full URL, including https://")
    .or(z.literal("")),
  yearsOfExperience: z
    .string()
    .trim()
    .refine(
      (v) =>
        v === "" ||
        (Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 60),
      { message: "Enter a whole number of years between 0 and 60" },
    ),
  currentCompany: z.string().trim(),
  expectedSalary: z
    .string()
    .trim()
    .refine((v) => v === "" || (Number.isFinite(Number(v)) && Number(v) >= 0), {
      message: "Enter an amount of 0 or more",
    })
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
