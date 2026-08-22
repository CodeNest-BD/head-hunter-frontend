import { z } from "zod";
import { specializationsSchema } from "@/shared/utils/specializations";

export const SUBSCRIPTION_STATUSES = [
  "none",
  "incomplete",
  "active",
  "past_due",
  "canceled",
] as const;
export const subscriptionStatusSchema = z.enum(SUBSCRIPTION_STATUSES);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

export const VERIFICATION_STATUSES = [
  "pending",
  "verified",
  "rejected",
] as const;
export const verificationStatusSchema = z.enum(VERIFICATION_STATUSES);
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;

export const recruiterReferenceSchema = z.object({
  id: z.string(),
  name: z.string(),
  company: z.string().nullable(),
  title: z.string().nullable(),
  phone: z.string().nullable(),
  createdAt: z.coerce.date(),
});
export type RecruiterReference = z.infer<typeof recruiterReferenceSchema>;

/** One staffing firm in the recruiter's history. */
export const recruiterExperienceSchema = z.object({
  id: z.string(),
  firmName: z.string(),
  years: z.number(),
  // Free-text labels stored by the backend, not an enum — render as-is.
  specializations: z.array(z.string()),
  createdAt: z.coerce.date(),
});
export type RecruiterExperience = z.infer<typeof recruiterExperienceSchema>;

export const recruiterProfileSchema = z.object({
  id: z.string(),
  addressLine: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zip: z.string().nullable(),
  linkedinUrl: z.string().nullable(),
  // Always returned to the owner. Never published to other users, unlike a
  // company's — verification only signals confirmed contact to admins.
  phone: z.string().nullable(),
  phoneVerified: z.boolean(),
  experiences: z.array(recruiterExperienceSchema),
  // Both derived from `experiences` by the API — the sum of the years and the
  // distinct union of the specializations. Read-only; edit the firms instead.
  yearsExperience: z.number().nullable(),
  specializations: z.array(z.string()),
  subscriptionStatus: subscriptionStatusSchema,
  // Tolerant: a backend that predates verification reads as "pending".
  verificationStatus: verificationStatusSchema.catch("pending"),
  verificationNote: z.string().nullable().catch(null),
  ratingAvg: z.number().nullable().catch(null),
  ratingCount: z.number().catch(0),
  hasMarketplaceAccess: z.boolean(),
  references: z.array(recruiterReferenceSchema),
});
export type RecruiterProfile = z.infer<typeof recruiterProfileSchema>;

export const reapplyRecruiterVerificationResponseSchema = z.object({
  verificationStatus: verificationStatusSchema,
});
export type ReapplyRecruiterVerificationResult = z.infer<
  typeof reapplyRecruiterVerificationResponseSchema
>;

/** The client's questionnaire repeats the firm block five times. */
export const MAX_EXPERIENCES = 5;

/** One firm as the form holds it — years is a string until submit. */
export const experienceFormSchema = z.object({
  firmName: z
    .string()
    .trim()
    .min(1, "Firm name is required")
    .max(160, "Keep it under 160 characters"),
  years: z
    .string()
    .trim()
    .refine(
      (v) =>
        v !== "" &&
        Number.isInteger(Number(v)) &&
        Number(v) >= 0 &&
        Number(v) <= 80,
      { message: "Enter a whole number of years between 0 and 80" },
    ),
  specializations: specializationsSchema,
});
export type ExperienceFormValues = z.infer<typeof experienceFormSchema>;

/** Profile edit form. Strings throughout; converted at the submit boundary. */
export const recruiterProfileFormSchema = z.object({
  addressLine: z.string().trim(),
  city: z.string().trim(),
  state: z
    .string()
    .trim()
    .length(2, "Use the two-letter state code")
    .or(z.literal("")),
  zip: z.string().trim(),
  linkedinUrl: z
    .string()
    .trim()
    .url("Enter a full URL, including https://")
    .or(z.literal("")),
  phone: z.string().trim().max(32, "Keep it under 32 characters"),
  experiences: z
    .array(experienceFormSchema)
    .max(MAX_EXPERIENCES, `At most ${MAX_EXPERIENCES} firms`),
});
export type RecruiterProfileFormValues = z.infer<
  typeof recruiterProfileFormSchema
>;

export const referenceFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  company: z.string().trim(),
  title: z.string().trim(),
  phone: z.string().trim(),
});
export type ReferenceFormValues = z.infer<typeof referenceFormSchema>;
