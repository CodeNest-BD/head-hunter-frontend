import { z } from "zod";

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
    commissionMin: z.string().trim(),
    commissionMax: z.string().trim(),
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
