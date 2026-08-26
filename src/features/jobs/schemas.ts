import { z } from "zod";

import { MAX_MONEY_MAJOR, MAX_MONEY_MAJOR_LABEL } from "@/shared/utils/money";

export const JOB_STATUSES = [
  "draft",
  "published",
  "paused",
  "filled",
  "closed",
  // Set by the platform 30 days after publish — never client-supplied.
  "expired",
] as const;
export const jobStatusSchema = z.enum(JOB_STATUSES);
export type JobStatus = z.infer<typeof jobStatusSchema>;

export const EMPLOYMENT_TYPES = ["full_time", "part_time", "contract"] as const;
export const employmentTypeSchema = z.enum(EMPLOYMENT_TYPES);
export type EmploymentType = z.infer<typeof employmentTypeSchema>;

/** How the salary range is quoted — mirrors the backend salary_rate_period enum. */
export const SALARY_RATE_PERIODS = [
  "per_year",
  "per_month",
  "per_week",
  "per_day",
  "per_hour",
] as const;
export const salaryRatePeriodSchema = z.enum(SALARY_RATE_PERIODS);
export type SalaryRatePeriod = z.infer<typeof salaryRatePeriodSchema>;

export const SALARY_RATE_PERIOD_LABELS: Record<SalaryRatePeriod, string> = {
  per_year: "Per Year",
  per_month: "Per Month",
  per_week: "Per Week",
  per_day: "Per Day",
  per_hour: "Per Hour",
};

/** Compact suffix for showing a range inline, e.g. "$120k – $150k / yr". */
export const SALARY_RATE_PERIOD_SUFFIX: Record<SalaryRatePeriod, string> = {
  per_year: "/ yr",
  per_month: "/ mo",
  per_week: "/ wk",
  per_day: "/ day",
  per_hour: "/ hr",
};

/** Mirrors the backend role_category enum. */
export const ROLE_CATEGORIES = [
  "engineering",
  "product",
  "design",
  "data",
  "sales",
  "marketing",
  "finance",
  "operations",
  "human_resources",
  "legal",
  "healthcare",
  "education",
  "customer_success",
  "executive",
  "other",
] as const;
export const roleCategorySchema = z.enum(ROLE_CATEGORIES);
export type RoleCategory = z.infer<typeof roleCategorySchema>;

export const jobSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  employmentType: employmentTypeSchema.nullable(),
  roleCategory: roleCategorySchema,
  locationState: z.string().nullable(),
  locationCity: z.string().nullable(),
  isRemote: z.boolean(),
  salaryMinMinor: z.number().nullable(),
  salaryMaxMinor: z.number().nullable(),
  recruiterFeeMinor: z.number(),
  // How the salary band is quoted; null on older jobs saved before it existed.
  salaryRatePeriod: salaryRatePeriodSchema.nullable().catch(null),
  status: jobStatusSchema,
  publishedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  // When a published role expires (30 days after publish); null while a draft.
  expiresAt: z.coerce.date().nullable().catch(null),
  // Always present — every job knows its company. Backs the company logo,
  // which is fetched from an id-based URL.
  companyProfileId: z.string().catch(""),
  // Present when GET /v1/jobs is browsed marketplace-wide (recruiters,
  // admins); absent when a company reads back its own jobs, which already
  // know whose they are. Tolerant so either shape parses.
  companyName: z.string().nullable().catch(null),
  /** True when the company has a logo; served from the id-based URL. */
  hasLogo: z.boolean().catch(false),
});
export type Job = z.infer<typeof jobSchema>;

/** Human labels; the API speaks snake_case enums. */
export const ROLE_CATEGORY_LABELS: Record<RoleCategory, string> = {
  engineering: "Engineering",
  product: "Product",
  design: "Design",
  data: "Data",
  sales: "Sales",
  marketing: "Marketing",
  finance: "Finance",
  operations: "Operations",
  human_resources: "Human resources",
  legal: "Legal",
  healthcare: "Healthcare",
  education: "Education",
  customer_success: "Customer success",
  executive: "Executive",
  other: "Other",
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: "Full time",
  part_time: "Part time",
  contract: "Contract",
};

/**
 * Job form. Numbers stay strings here because inputs produce strings; they are
 * converted to minor units at submit. Mirrors the backend CreateJobDto,
 * including the salary-range CHECK, so errors surface before a round-trip.
 */
export const jobFormSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),
    // The editor normalises an empty document to "", so min(1) really does mean
    // "has text" rather than "has markup".
    description: z
      .string()
      .trim()
      .min(1, "A description is required — recruiters read it before pitching")
      .max(20000, "Description is too long (20,000 characters max)"),
    roleCategory: roleCategorySchema,
    // Kept as a union with "" so the form can start empty; the refine is what
    // makes it required, and RHF's default value still type-checks.
    employmentType: employmentTypeSchema
      .or(z.literal(""))
      // `value.length > 0` rather than `value !== ""`: the latter reads as a type
      // guard, so zod narrows "" out of the inferred type and the form's empty
      // default stops type-checking.
      .refine((value) => value.length > 0, {
        message: "Pick an employment type",
      }),
    // Two letters when given; whether it may be omitted depends on isRemote,
    // which a field-level rule cannot see — see the superRefine below.
    locationState: z
      .string()
      .trim()
      .length(2, "Use the two-letter state code")
      .or(z.literal("")),
    locationCity: z.string().trim(),
    isRemote: z.boolean(),
    salaryMin: z
      .string()
      .trim()
      .refine(
        (v) => v === "" || (Number.isFinite(Number(v)) && Number(v) >= 0),
        {
          message: "Enter an amount of 0 or more",
        },
      )
      .refine((v) => v === "" || Number(v) <= MAX_MONEY_MAJOR, {
        message: `Salary must be under ${MAX_MONEY_MAJOR_LABEL}`,
      }),
    salaryMax: z
      .string()
      .trim()
      .refine(
        (v) => v === "" || (Number.isFinite(Number(v)) && Number(v) >= 0),
        {
          message: "Enter an amount of 0 or more",
        },
      )
      .refine((v) => v === "" || Number(v) <= MAX_MONEY_MAJOR, {
        message: `Salary must be under ${MAX_MONEY_MAJOR_LABEL}`,
      }),
    salaryRatePeriod: salaryRatePeriodSchema,
    // Bounded at MAX_MONEY_MAJOR only — the hard ceiling every money field
    // shares. JobsService separately enforces an admin-tunable marketplace
    // policy ceiling (currently $1,000,000) on top of this; that figure is
    // NOT this form's business, so do not hardcode it here. A fee between
    // this bound and the policy ceiling is refused by the API as a 400.
    recruiterFee: z
      .string()
      .trim()
      .min(1, "Recruiter fee is required")
      .refine((value) => Number.isFinite(Number(value)) && Number(value) >= 0, {
        message: "Enter a non-negative amount",
      })
      .refine((value) => Number(value) <= MAX_MONEY_MAJOR, {
        message: `Commission must be under ${MAX_MONEY_MAJOR_LABEL}`,
      }),
  })
  .refine(
    (values) => {
      if (values.salaryMin === "" || values.salaryMax === "") return true;
      const min = Number(values.salaryMin);
      const max = Number(values.salaryMax);
      if (!Number.isFinite(min) || !Number.isFinite(max)) return true;
      return max >= min;
    },
    { message: "Maximum must be at least the minimum", path: ["salaryMax"] },
  )
  // A located role needs its state: the job map groups by it and skips rows
  // without one, so a stateless on-site job is invisible on the marketplace's
  // main discovery surface. A remote role has no state to give.
  .superRefine((values, ctx) => {
    if (!values.isRemote && values.locationState === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["locationState"],
        message: "Pick a state, or mark the role remote",
      });
    }
  });
export type JobFormValues = z.infer<typeof jobFormSchema>;

/** One row of GET /v1/jobs/map — a per-state/city aggregate behind the job map. */
export const jobMapEntrySchema = z.object({
  locationState: z.string(),
  locationCity: z.string().nullable().catch(null),
  openRoles: z.number(),
  /** Total recruiter fees available across this city's live listings. */
  totalFeeMinor: z.number(),
});
export type JobMapEntry = z.infer<typeof jobMapEntrySchema>;
