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
    description: z
      .string()
      .trim()
      .max(20000, "Description is too long (20,000 characters max)"),
    roleCategory: roleCategorySchema,
    employmentType: employmentTypeSchema.or(z.literal("")),
    locationState: z
      .string()
      .trim()
      .length(2, "Use the two-letter state code")
      .or(z.literal("")),
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

/** One row of GET /v1/jobs/map — a per-state/city aggregate behind the job map. */
export const jobMapEntrySchema = z.object({
  locationState: z.string(),
  locationCity: z.string().nullable().catch(null),
  openRoles: z.number(),
  averageFeeMinor: z.number(),
});
export type JobMapEntry = z.infer<typeof jobMapEntrySchema>;
