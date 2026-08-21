import { z } from "zod";

/** Mirrors the backend recruiter_specialization enum. */
export const SPECIALIZATIONS = [
  "accounting",
  "finance",
  "human_resources",
  "technology",
  "pharma",
  "skilled_trades",
  "medical",
] as const;
export const specializationSchema = z.enum(SPECIALIZATIONS);
export type Specialization = z.infer<typeof specializationSchema>;

export const SPECIALIZATION_LABELS: Record<Specialization, string> = {
  accounting: "Accounting",
  finance: "Finance",
  human_resources: "Human resources",
  technology: "Technology",
  pharma: "Pharma",
  skilled_trades: "Skilled trades",
  medical: "Medical",
};

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

export const recruiterProfileSchema = z.object({
  id: z.string(),
  addressLine: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zip: z.string().nullable(),
  yearsExperience: z.number().nullable(),
  specializations: z.array(specializationSchema).nullable(),
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
  yearsExperience: z
    .string()
    .trim()
    .refine(
      (v) =>
        v === "" ||
        (Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 80),
      { message: "Enter a whole number of years between 0 and 80" },
    ),
  specializations: z.array(specializationSchema),
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
