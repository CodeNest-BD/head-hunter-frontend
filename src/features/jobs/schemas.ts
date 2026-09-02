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

/** Shown on the form's Pay Type control. The `/ yr` and `/ hr` suffixes below
 * are the compact display form of the same two values. */
export const SALARY_RATE_PERIOD_LABELS: Record<SalaryRatePeriod, string> = {
  per_year: "Yearly",
  per_hour: "Hourly",
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

/** Job-card wording — see POSITION_OPEN_REASON_CARD_LABELS: a bare "2 weeks"
 * beside the other pills reads as any duration on the listing. */
export const OFFER_TIMELINE_CARD_LABELS: Record<OfferTimeline, string> = {
  asap: "Offering ASAP",
  within_2_weeks: "Offer In 2 Weeks",
  within_1_month: "Offer In 1 Month",
  flexible: "Offer Timing Flexible",
};

/** The intake question's own wording ("When Do You Hope to Make an Offer?"),
 * which reads in the first person where the display labels read as a value. */
export const OFFER_TIMELINE_QUESTION_LABELS: Record<OfferTimeline, string> = {
  asap: "ASAP",
  within_2_weeks: "Within 2 Weeks",
  within_1_month: "Within 1 Month",
  flexible: "I'm Flexible",
};

/** Where the work happens — mirrors the backend WorkModel. `Job.isRemote` stays
 * the filterable column and is derived from this, so a hybrid role keeps its
 * worksite and still appears on the state map. */
export const WORK_MODELS = ["on_site", "remote", "hybrid"] as const;
export const workModelSchema = z.enum(WORK_MODELS);
export type WorkModel = z.infer<typeof workModelSchema>;

export const WORK_MODEL_LABELS: Record<WorkModel, string> = {
  on_site: "On-site",
  remote: "Remote",
  hybrid: "Hybrid",
};

/** Why the seat is open — mirrors the backend PositionOpenReason. */
export const POSITION_OPEN_REASONS = [
  "adding_on",
  "replacing_former",
  "replacing_current",
] as const;
export const positionOpenReasonSchema = z.enum(POSITION_OPEN_REASONS);
export type PositionOpenReason = z.infer<typeof positionOpenReasonSchema>;

export const POSITION_OPEN_REASON_LABELS: Record<PositionOpenReason, string> = {
  adding_on: "Adding On",
  replacing_former: "Replacing Former Employee",
  replacing_current: "Replacing Current Employee",
};

/**
 * Job-card wording. A card pill carries no caption to say what it answers, so
 * each label has to name its own fact: "Adding On" beside "Full-Time" reads as
 * a second employment type.
 */
export const POSITION_OPEN_REASON_CARD_LABELS: Record<
  PositionOpenReason,
  string
> = {
  adding_on: "Add On Role",
  replacing_former: "Replacing Former Employee",
  replacing_current: "Replacing Current Employee",
};

/** The client asks for exactly three hiring-decision keys. */
export const MAX_SELECTION_KEYS = 3;

/** Mirrors the backend cap: a paragraph about the company, not a pitch deck. */
export const MAX_WHAT_THEY_DO_LENGTH = 600;

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

/** What a company can pick for a round. Narrower than the backend enum, which
 * still carries `video_panel` so rounds saved before it was dropped keep
 * parsing and rendering their label. */
export const INTERVIEW_TYPE_OPTIONS: ReadonlyArray<InterviewType> = [
  "phone",
  "video",
  "in_person",
];

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
  educationReimbursement: z.boolean().optional(),
  // Day counts are optional on top of the flags: a company may offer the
  // benefit without committing to a number.
  vacationDays: z.number().optional(),
  sickDays: z.number().optional(),
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
  { key: "sickTime", label: "Personal/Sick Time" },
  { key: "vacation", label: "Vacation Time" },
];

/**
 * Mirrors the backend CompanyDetailsDto. Every field is optional there and
 * here: the job form prefills these from the company profile, which fills up
 * over time, so a company that has answered only some of them still gets the
 * ones it has onto the job.
 */
export const companyDetailsSchema = z.object({
  industry: z.string().optional(),
  employeeSize: z.string().optional(),
  revenue: z.string().optional(),
  yearsInBusiness: z.number().optional(),
  whatTheyDo: z.string().optional(),
});
export type CompanyDetails = z.infer<typeof companyDetailsSchema>;

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
 * `.passthrough()` is load-bearing: the backend blob holds keys this form does
 * not collect (`positionDuties`, and whatever a later surface adds). Keeping
 * the unknown keys means an edit through the job form writes back the fields it
 * collects without destroying the ones it does not.
 */
export const jobIntakeSchema = z
  .object({
    companyDetails: companyDetailsSchema.optional().catch(undefined),
    workModel: workModelSchema.optional().catch(undefined),
    onsiteDaysPerWeek: z.number().optional().catch(undefined),
    worksiteAddress: z.string().optional().catch(undefined),
    worksiteZip: z.string().optional().catch(undefined),
    benefitsSummary: z.string().optional().catch(undefined),
    selectionKeys: z.array(z.string()).optional().catch(undefined),
    positionOpenReason: positionOpenReasonSchema.optional().catch(undefined),
    confidentialSearch: z.boolean().optional().catch(undefined),
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
  human_resources: "Human Resources",
  legal: "Legal",
  healthcare: "Healthcare",
  education: "Education",
  customer_success: "Customer Service",
  executive: "Executive",
  other: "Other",
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: "Full-Time",
  part_time: "Part-Time",
};

/** A day count as the input holds it; "" means the company didn't quantify it. */
const dayCountField = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" || (/^\d{1,3}$/.test(value) && Number(value) <= 365),
    { message: "Enter a number of days between 0 and 365" },
  );

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
    // Same union-with-"" treatment as employmentType below: nothing is
    // preselected, so the company picks the category rather than inheriting
    // whichever one happened to sort first.
    roleCategory: roleCategorySchema
      .or(z.literal(""))
      .refine((value) => value.length > 0, {
        message: "Pick a role category",
      }),
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
    // Two letters when given; whether it may be omitted depends on the work
    // model, which a field-level rule cannot see — see the superRefine below.
    locationState: z
      .string()
      .trim()
      .length(2, "Use the two-letter state code")
      .or(z.literal("")),
    locationCity: z.string().trim(),
    // Three-state, with `isRemote` derived at submit: a hybrid role has a
    // worksite, so it must not read as remote to the map or the filters.
    workModel: workModelSchema,
    // A string because the input produces one; "" means "not said". Only
    // meaningful for a hybrid role.
    onsiteDaysPerWeek: z
      .string()
      .trim()
      .refine((value) => value === "" || /^[0-7]$/.test(value), {
        message: "Enter a number of days between 0 and 7",
      }),
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
    // Display only, mirrored from the company profile: the API resolves a job's
    // company from its owner and strips an intake `companyName` outright, so
    // this is never written. It backs the read-only field and the preview.
    companyName: z.string(),
    companyDetails: z.object({
      industry: z.string().trim().max(120, "Keep it under 120 characters"),
      employeeSize: z.string().trim().max(60, "Keep it under 60 characters"),
      revenue: z.string().trim().max(60, "Keep it under 60 characters"),
      // A string because the input produces one; "" means "not said".
      yearsInBusiness: z
        .string()
        .trim()
        .refine((value) => value === "" || /^\d{1,3}$/.test(value), {
          message: "Enter a whole number of years",
        }),
      whatTheyDo: z
        .string()
        .trim()
        .max(MAX_WHAT_THEY_DO_LENGTH, "Keep it under 600 characters"),
    }),
    worksiteAddress: z.string().trim().max(200, "Keep it under 200 characters"),
    worksiteZip: z
      .string()
      .trim()
      .refine((value) => value === "" || /^\d{5}(-\d{4})?$/.test(value), {
        message: "Enter a 5-digit ZIP, or ZIP+4",
      }),
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
      educationReimbursement: z.boolean(),
      // Strings because the inputs produce them; "" means "not quantified".
      vacationDays: dayCountField,
      sickDays: dayCountField,
    }),
    benefitsSummary: z
      .string()
      .trim()
      .max(2000, "Keep it under 2,000 characters"),
    selectionKeys: z
      .array(z.string().trim().max(200, "Keep it under 200 characters"))
      .max(MAX_SELECTION_KEYS, `Up to ${MAX_SELECTION_KEYS} keys`),
    positionOpenReason: positionOpenReasonSchema.or(z.literal("")),
    confidentialSearch: z.boolean(),
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
    if (values.workModel !== "remote" && values.locationState === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["locationState"],
        message: "Pick a state, or set the work model to Remote",
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
