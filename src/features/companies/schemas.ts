import { z } from "zod";

import { personNameSchema } from "@/shared/libs/personName";
import {
  addressLineSchema,
  citySchema,
  stateSchema,
  zipSchema,
} from "@/shared/libs/usAddress";
import { usPhoneDigitsSchema } from "@/shared/libs/usPhone";
import { MAX_MONEY_MAJOR, MAX_MONEY_MAJOR_LABEL } from "@/shared/utils/money";

/** Admin approval states, shared with the recruiter side. */
export const VERIFICATION_STATUSES = [
  "pending",
  "verified",
  "rejected",
] as const;
export const verificationStatusSchema = z.enum(VERIFICATION_STATUSES);
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;

/** One end of the advertised commission range, as the form holds it. Empty
 * means "not published" rather than $0, which is why every rule is guarded on
 * the empty string instead of the field being required. */
const commissionAmount = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0),
    { message: "Enter an amount of 0 or more" },
  )
  .refine((value) => value === "" || Number(value) <= MAX_MONEY_MAJOR, {
    message: `Commission must be under ${MAX_MONEY_MAJOR_LABEL}`,
  });

/** GET /v1/company-profiles/me — the company's own, editable record. */
export const companyProfileSchema = z.object({
  id: z.string(),
  companyName: z.string(),
  website: z.string().nullable(),
  description: z.string().nullable(),
  addressLine: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zip: z.string().nullable(),
  industry: z.string().nullable(),
  yearFounded: z.number().nullable(),
  employeeSize: z.string().nullable(),
  revenue: z.string().nullable(),
  // The person who signed the company up. Lives on the User row, which is why
  // it is never null the way the profile's own columns are.
  firstName: z.string(),
  lastName: z.string(),
  // Always returned to the owner, verified or not. Other marketplace users
  // only ever see it once phoneVerified is true.
  phone: z.string().nullable(),
  phoneVerified: z.boolean(),
  commissionRangeMinMinor: z.number().nullable(),
  commissionRangeMaxMinor: z.number().nullable(),
  currency: z.string(),
  /** True once a logo is uploaded; the image is served from the id-based URL. */
  hasLogo: z.boolean().catch(false),
  // `.catch` so an unrecognised status degrades to "pending" (the safe, gated
  // reading) rather than throwing the whole profile away.
  verificationStatus: verificationStatusSchema.catch("pending"),
  verifiedAt: z.string().nullable().catch(null),
  verificationNote: z.string().nullable().catch(null),
  /** Mirrors the server's approval gate, so the UI can explain a 403 before provoking one. */
  hasMarketplaceAccess: z.boolean().catch(false),
});
export type CompanyProfile = z.infer<typeof companyProfileSchema>;

/** POST /v1/company-profiles/me/logo/presign — a one-shot signed upload URL. */
export const presignedUploadSchema = z.object({
  s3Key: z.string(),
  uploadUrl: z.string(),
});
export type PresignedUpload = z.infer<typeof presignedUploadSchema>;

/** POST /v1/company-profiles/me/reapply — always returns to `pending`. */
export const reapplyCompanyVerificationResponseSchema = z.object({
  verificationStatus: verificationStatusSchema,
});
export type ReapplyCompanyVerificationResult = z.infer<
  typeof reapplyCompanyVerificationResponseSchema
>;

/** A company as seen by someone browsing. */
export const companySummarySchema = z.object({
  id: z.string(),
  companyName: z.string(),
  website: z.string().nullable(),
  description: z.string().nullable(),
  commissionRangeMinMinor: z.number().nullable(),
  commissionRangeMaxMinor: z.number().nullable(),
  hasLogo: z.boolean().catch(false),
  // Null while the company's number is unverified — the API withholds it.
  phone: z.string().nullable(),
});
export type CompanySummary = z.infer<typeof companySummarySchema>;

/**
 * Edit form. Every field optional so a partial save is valid, mirroring the
 * backend's UpdateCompanyProfileDto. The cross-field range rule matches
 * CHK_company_profiles_commission_range so the user hears about it before a
 * round-trip.
 */
export const companyProfileFormSchema = z
  .object({
    companyName: z.string().trim().min(1, "Company name is required"),
    website: z
      .string()
      .trim()
      .url("Enter a full URL, including https://")
      .or(z.literal("")),
    description: z.string().trim(),
    // Bounded the same way every other money field is: the backend rejects
    // anything over MAX_MONEY_MINOR on both ends of this range, so an
    // oversized figure is caught here rather than after a round-trip.
    commissionMin: commissionAmount,
    commissionMax: commissionAmount,
    // The same four rules sign-up applies — required, not merely well-shaped.
    // An account cannot edit its way out of having an address.
    addressLine: addressLineSchema,
    city: citySchema,
    state: stateSchema,
    zip: zipSchema,
    industry: z.string().trim().max(120, "Keep it under 120 characters"),
    yearFounded: z
      .string()
      .trim()
      .refine(
        (value) =>
          value === "" ||
          (/^\d{4}$/.test(value) &&
            Number(value) >= 1800 &&
            Number(value) <= new Date().getFullYear()),
        { message: "Enter a year between 1800 and today" },
      ),
    employeeSize: z.string().trim().max(40, "Keep it under 40 characters"),
    revenue: z.string().trim().max(40, "Keep it under 40 characters"),
  })
  .refine(
    (values) => {
      const min = Number(values.commissionMin);
      const max = Number(values.commissionMax);
      if (values.commissionMin === "" || values.commissionMax === "")
        return true;
      if (!Number.isFinite(min) || !Number.isFinite(max)) return true;
      return max >= min;
    },
    {
      message: "Maximum must be at least the minimum",
      path: ["commissionMax"],
    },
  );
export type CompanyProfileFormValues = z.infer<typeof companyProfileFormSchema>;

/**
 * The contact person's own details. Kept apart from the profile form because
 * these three write to the User row, not to the company profile columns.
 */
export const companyEmployeeInfoFormSchema = z.object({
  firstName: personNameSchema("First name"),
  lastName: personNameSchema("Last name"),
  phone: usPhoneDigitsSchema,
});
export type CompanyEmployeeInfoFormValues = z.infer<
  typeof companyEmployeeInfoFormSchema
>;
