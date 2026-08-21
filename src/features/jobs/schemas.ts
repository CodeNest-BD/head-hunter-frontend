import { z } from "zod";

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
  status: jobStatusSchema,
  publishedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  // Present when GET /v1/jobs is browsed marketplace-wide (recruiters,
  // admins); absent when a company reads back its own jobs, which already
  // know whose they are. Tolerant so either shape parses.
  companyName: z.string().nullable().catch(null),
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
    // Required because the job map groups by state and skips rows without one:
    // a stateless job is invisible on the marketplace's main discovery surface.
    locationState: z
      .string()
      .trim()
      .length(2, "Pick the state this role sits in"),
    locationCity: z.string().trim(),
    isRemote: z.boolean(),
    salaryMin: z.string().trim(),
    salaryMax: z.string().trim(),
    recruiterFee: z
      .string()
      .trim()
      .min(1, "Recruiter fee is required")
      .refine((value) => Number.isFinite(Number(value)) && Number(value) >= 0, {
        message: "Enter a non-negative amount",
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
  );
export type JobFormValues = z.infer<typeof jobFormSchema>;

/** One row of GET /v1/jobs/map — the per-state aggregate behind the job map. */
export const jobMapEntrySchema = z.object({
  locationState: z.string(),
  openRoles: z.number(),
  averageFeeMinor: z.number(),
});
export type JobMapEntry = z.infer<typeof jobMapEntrySchema>;
