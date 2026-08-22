import { z } from "zod";

import { MAX_MONEY_MAJOR, MAX_MONEY_MAJOR_LABEL } from "@/shared/utils/money";

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
  // Always returned to the owner, verified or not. Other marketplace users
  // only ever see it once phoneVerified is true.
  phone: z.string().nullable(),
  phoneVerified: z.boolean(),
  commissionRangeMinMinor: z.number().nullable(),
  commissionRangeMaxMinor: z.number().nullable(),
  currency: z.string(),
});
export type CompanyProfile = z.infer<typeof companyProfileSchema>;

/** A company as seen by someone browsing. */
export const companySummarySchema = z.object({
  id: z.string(),
  companyName: z.string(),
  website: z.string().nullable(),
  description: z.string().nullable(),
  commissionRangeMinMinor: z.number().nullable(),
  commissionRangeMaxMinor: z.number().nullable(),
  // Null while the company's number is unverified — the API withholds it.
  phone: z.string().nullable(),
  isFollowedByMe: z.boolean(),
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
    addressLine: z.string().trim().max(200, "Keep it under 200 characters"),
    city: z.string().trim().max(120, "Keep it under 120 characters"),
    state: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{2}$/, "Use the two-letter state code")
      .or(z.literal("")),
    // Stricter than the API, which takes any string here: the sign-up form
    // already holds the user to this shape, so the profile should not quietly
    // accept a ZIP it would have rejected an hour earlier.
    zip: z
      .string()
      .trim()
      .regex(/^\d{5}(-\d{4})?$/, "Enter a 5-digit ZIP or ZIP+4, e.g. 94103")
      .or(z.literal("")),
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
    phone: z.string().trim().max(32, "Keep it under 32 characters"),
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
