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

export const EMPLOYMENT_TYPES = ["full_time", "part_time"] as const;
export const employmentTypeSchema = z.enum(EMPLOYMENT_TYPES);
export type EmploymentType = z.infer<typeof employmentTypeSchema>;

/** How the pay range is quoted — mirrors the backend salary_rate_period enum,
 * which still carries the retired per-month/week/day values for old rows. */
export const SALARY_RATE_PERIODS = ["per_year", "per_hour"] as const;
export const salaryRatePeriodSchema = z.enum(SALARY_RATE_PERIODS);
export type SalaryRatePeriod = z.infer<typeof salaryRatePeriodSchema>;

export const SALARY_RATE_PERIOD_LABELS: Record<SalaryRatePeriod, string> = {
  per_year: "Per Year",
  per_hour: "Per Hour",
};

/** Compact suffix for showing a range inline, e.g. "$120k – $150k / yr". */
export const SALARY_RATE_PERIOD_SUFFIX: Record<SalaryRatePeriod, string> = {
  per_year: "/ yr",
  per_hour: "/ hr",
};

/** How soon the company wants to hire — mirrors the backend OfferTimeline. */
export const OFFER_TIMELINES = [
  "asap",
  "within_2_weeks",
  "within_1_month",
  "flexible",
] as const;
export const offerTimelineSchema = z.enum(OFFER_TIMELINES);
export type OfferTimeline = z.infer<typeof offerTimelineSchema>;

export const OFFER_TIMELINE_LABELS: Record<OfferTimeline, string> = {
  asap: "ASAP",
  within_2_weeks: "Within 2 Weeks",
  within_1_month: "Within 1 Month",
  flexible: "Flexible",
};

/** Card-sized wording: a pill sits beside Full-Time / On-site and has no room
 * for the full phrasing the detail page uses. */
export const OFFER_TIMELINE_SHORT_LABELS: Record<OfferTimeline, string> = {
  asap: "ASAP",
  within_2_weeks: "2 weeks",
  within_1_month: "1 month",
  flexible: "Flexible",
};

/** Mirrors the backend InterviewType. */
export const INTERVIEW_TYPES = [
  "phone",
  "video",
  "video_panel",
  "in_person",
] as const;
export const interviewTypeSchema = z.enum(INTERVIEW_TYPES);
export type InterviewType = z.infer<typeof interviewTypeSchema>;

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  phone: "Phone",
  video: "Video",
  video_panel: "Video panel",
  in_person: "In person",
};

export const MAX_INTERVIEW_STAGES = 5;
export const MAX_QUALIFICATIONS = 10;
export const MAX_QUALIFICATION_LENGTH = 80;

/** What else the company is doing to fill the role — mirrors OtherSourcing. */
export const OTHER_SOURCING_OPTIONS = [
  "other_agencies",
  "internal_talent_team",
  "none",
] as const;
export const otherSourcingSchema = z.enum(OTHER_SOURCING_OPTIONS);
export type OtherSourcing = z.infer<typeof otherSourcingSchema>;

export const OTHER_SOURCING_LABELS: Record<OtherSourcing, string> = {
  other_agencies: "Yes - Other Agencies",
  internal_talent_team: "Yes - Internal Talent Acquisition Team",
  none: "No",
};

export const benefitsSchema = z.object({
  medical: z.boolean(),
  dental: z.boolean(),
  vision: z.boolean(),
  sickTime: z.boolean(),
  vacation: z.boolean(),
  ancillary: z.boolean(),
  ancillaryDetails: z.string().optional(),
  retirement401k: z.object({
    offered: z.boolean(),
    matchPercent: z.number().optional(),
    details: z.string().optional(),
  }),
});
export type Benefits = z.infer<typeof benefitsSchema>;

/** The benefit checkboxes, in the order the client listed them. */
export const BENEFIT_CHECKBOXES: ReadonlyArray<{
  key: "medical" | "dental" | "vision" | "sickTime" | "vacation";
  label: string;
}> = [
  { key: "medical", label: "Medical" },
  { key: "dental", label: "Dental" },
  { key: "vision", label: "Vision" },
  { key: "sickTime", label: "Sick Time" },
  { key: "vacation", label: "Vacation" },
];

export const interviewingAvailabilitySchema = z.object({
  asap: z.boolean(),
  from: z.string().optional(),
  to: z.string().optional(),
});
export type InterviewingAvailability = z.infer<
  typeof interviewingAvailabilitySchema
>;

/** The stage durations the form offers, in minutes, with their wording. */
export const INTERVIEW_DURATIONS: ReadonlyArray<{
  minutes: number;
  label: string;
}> = [
  { minutes: 30, label: "30 min" },
  { minutes: 45, label: "45 min" },
  { minutes: 60, label: "1 hr" },
  { minutes: 90, label: "1.5 hr" },
  { minutes: 240, label: "Half day" },
  { minutes: 480, label: "Full day" },
];

const DURATION_LABEL_BY_MINUTES = new Map(
  INTERVIEW_DURATIONS.map((option) => [option.minutes, option.label]),
);

/** Renders a stage duration: a preset reads as its wording, anything else (an
 * older job, or an intake written by another client) falls back to minutes. */
export function interviewDurationLabel(minutes: number): string {
  return DURATION_LABEL_BY_MINUTES.get(minutes) ?? `${minutes} min`;
}

/** A must-have / nice-to-have chip list, bounded the way the API bounds it. */
export const qualificationListSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1, "A requirement can't be empty")
      .max(
        MAX_QUALIFICATION_LENGTH,
        `Keep each requirement under ${MAX_QUALIFICATION_LENGTH} characters`,
      ),
  )
  .max(MAX_QUALIFICATIONS, `Up to ${MAX_QUALIFICATIONS} requirements`);

export const interviewStageSchema = z.object({
  order: z.number(),
  type: interviewTypeSchema,
  durationMinutes: z.number(),
});
export type InterviewStage = z.infer<typeof interviewStageSchema>;

/**
 * The job intake questionnaire, as the company's own job returns it.
 *
 * `.passthrough()` is load-bearing: the backend blob also holds the worksite
 * address, benefits and company details, which this app never renders. Keeping
 * the unknown keys means an edit through the job form writes back the fields it
 * collects without destroying the ones it does not.
 */
export const jobIntakeSchema = z
  .object({
    worksiteAddress: z.string().optional().catch(undefined),
    daysAndHours: z.string().optional().catch(undefined),
    reportsTo: z.string().optional().catch(undefined),
    benefits: benefitsSchema.optional().catch(undefined),
    offerTimeline: offerTimelineSchema.optional().catch(undefined),
    qualifications: z
      .object({
        mustHave: z.array(z.string()).catch([]),
        niceToHave: z.array(z.string()).catch([]),
      })
      .optional()
      .catch(undefined),
    interviewProcess: z.array(interviewStageSchema).optional().catch(undefined),
    interviewingAvailability: interviewingAvailabilitySchema
      .optional()
      .catch(undefined),
    postedOnlineElsewhere: z.boolean().optional().catch(undefined),
    otherSourcing: otherSourcingSchema.optional().catch(undefined),
  })
  .passthrough();
export type JobIntake = z.infer<typeof jobIntakeSchema>;

/**
 * Mirrors the backend role_category enum.
 *
 * Deliberately NOT the same vocabulary as a recruiter's
 * `SPECIALIZATION_SUGGESTIONS`: this describes what a job is (a fixed DB enum
 * companies pick from and recruiters filter on), while a specialization
 * describes a recruiter's expertise and is free text. The overlap in names is
 * coincidence — do not derive one list from the other, and do not "sync" them.
 */
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
  // `.catch(null)` so a row still holding the retired `contract` value reads as
  // unset instead of failing the whole job's parse.
  employmentType: employmentTypeSchema.nullable().catch(null),
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
  // The intake questionnaire. Null on jobs posted before it existed.
  intake: jobIntakeSchema.nullable().catch(null),
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
  full_time: "Full-Time",
  part_time: "Part-Time",
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
    // ---- the intake questionnaire; all optional, all stored in `intake` ----
    // "" is "not said": a company that skips these publishes exactly as before.
    worksiteAddress: z.string().trim().max(200, "Keep it under 200 characters"),
    daysAndHours: z.string().trim().max(200, "Keep it under 200 characters"),
    reportsTo: z.string().trim().max(120, "Keep it under 120 characters"),
    benefits: z.object({
      medical: z.boolean(),
      dental: z.boolean(),
      vision: z.boolean(),
      sickTime: z.boolean(),
      vacation: z.boolean(),
      retirement401k: z.boolean(),
      // A string because the input produces one; "" means "offered, unstated".
      retirement401kMatch: z
        .string()
        .trim()
        .refine(
          (value) =>
            value === "" ||
            (/^\d{1,3}(\.\d)?$/.test(value) && Number(value) <= 100),
          { message: "Enter a match between 0 and 100" },
        ),
      ancillary: z.boolean(),
      ancillaryDetails: z
        .string()
        .trim()
        .max(200, "Keep it under 200 characters"),
    }),
    // Interviewing availability: ASAP, or a date range.
    interviewingAsap: z.boolean(),
    interviewingFrom: z.string().trim(),
    interviewingTo: z.string().trim(),
    postedOnline: z.union([z.literal("yes"), z.literal("no"), z.literal("")]),
    otherSourcing: otherSourcingSchema.or(z.literal("")),
    timelineToHire: offerTimelineSchema.or(z.literal("")),
    mustHave: qualificationListSchema,
    niceToHave: qualificationListSchema,
    interviewRounds: z
      .array(
        z.object({
          type: interviewTypeSchema,
          // A select of preset minutes, so the string is always parseable.
          durationMinutes: z.string(),
        }),
      )
      .max(MAX_INTERVIEW_STAGES, `At most ${MAX_INTERVIEW_STAGES} rounds`),
  })
  .refine(
    (values) => {
      if (values.salaryMin === "" || values.salaryMax === "") return true;
      const min = Number(values.salaryMin);
      const max = Number(values.salaryMax);
      if (!Number.isFinite(min) || !Number.isFinite(max)) return true;
      return max > min;
    },
    {
      message: "Maximum must be greater than the minimum",
      path: ["salaryMax"],
    },
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
    // Checked here rather than on the field because it spans two of them.
    if (
      !values.interviewingAsap &&
      values.interviewingFrom !== "" &&
      values.interviewingTo !== "" &&
      values.interviewingTo < values.interviewingFrom
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["interviewingTo"],
        message: "End the range on or after it starts",
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
