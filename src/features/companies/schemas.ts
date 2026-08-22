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
