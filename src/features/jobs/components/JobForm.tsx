"use client";

import { forwardRef, useEffect, useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Info, PanelRightOpen, X } from "lucide-react";
import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import { NumericInput } from "@/shared/ui-components/controls/NumericInput";
import { COMPANY_SIZE_OPTIONS } from "@/shared/data/companySize";
import { Label } from "@/shared/ui-components/controls/label";
import { Textarea } from "@/shared/ui-components/controls/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui-components/controls/tooltip";
import { RichTextEditor } from "@/shared/ui-components/controls/RichTextEditor";
import { FormSection } from "@/shared/ui-components/layout/FormSection";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui-components/controls/select";
import { useMinRecruiterFee } from "@/features/billing";
import { sanitizeRichText } from "@/shared/libs/richText";
import {
  formatMinor,
  majorInputToMinor,
  majorToMinor,
  minorToMajorInput,
} from "@/shared/utils/money";
import {
  BENEFIT_CHECKBOXES,
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  INTERVIEW_DURATIONS,
  INTERVIEW_TYPE_OPTIONS,
  INTERVIEW_TYPE_LABELS,
  MAX_INTERVIEW_STAGES,
  MAX_QUALIFICATIONS,
  MAX_QUALIFICATION_LENGTH,
  OFFER_TIMELINES,
  MAX_SELECTION_KEYS,
  OFFER_TIMELINE_QUESTION_LABELS,
  OTHER_SOURCING_LABELS,
  OTHER_SOURCING_OPTIONS,
  POSITION_OPEN_REASONS,
  POSITION_OPEN_REASON_LABELS,
  ROLE_CATEGORIES,
  ROLE_CATEGORY_LABELS,
  SALARY_RATE_PERIODS,
  SALARY_RATE_PERIOD_LABELS,
  WORK_MODELS,
  WORK_MODEL_LABELS,
  jobFormSchema,
  type Job,
  type JobFormValues,
  type WorkModel,
} from "../schemas";
import { intakeToFormValues, toIntakeInput } from "../utils/jobIntake";
import {
  BenefitsAttachmentField,
  benefitsDocumentError,
  type BenefitsDocumentState,
} from "./BenefitsAttachmentField";
import { DaysAndHoursField } from "./DaysAndHoursField";
import { PayRangeField } from "./PayRangeField";
import { ChipListField } from "@/shared/ui-components/controls/ChipListField";
import { Checkbox } from "@/shared/ui-components/controls/checkbox";
import { useMyCompanyProfile } from "@/features/companies";
import type { JobWriteInput } from "../api/jobs";
import { useStateCities } from "@/shared/hooks/useStateCities";
import { CityCombobox } from "@/shared/ui-components/controls/CityCombobox";
import { StateSelect } from "@/shared/ui-components/controls/StateSelect";
import { toUsStateCode } from "@/shared/data/usStatesGeo";
import { JobLivePreview } from "./JobLivePreview";

/** Persists the live-preview open/closed choice across navigations and reloads. */
const PREVIEW_OPEN_KEY = "hh-job-preview-open";

/** Consistent control height across the form's dense single-card layout. */
const CONTROL_HEIGHT = "h-10";

/** Shared by the live message under the fee field and the submit-time error, so
 * a company reads the same sentence either way. */
const feeFloorMessage = (amountMinor: number): string =>
  `Recruiter fee must be at least ${formatMinor(amountMinor)}`;

type BenefitKey = (typeof BENEFIT_CHECKBOXES)[number]["key"];

/** The benefit grid places its cells by hand to match the intake layout, so the
 * shared label list is read by key rather than mapped in its own order. */
const BENEFIT_LABELS = new Map<BenefitKey, string>(
  BENEFIT_CHECKBOXES.map((benefit) => [benefit.key, benefit.label]),
);

interface JobFormProps {
  job?: Job;
  /**
   * `intent` is "draft" for a plain save and "publish" for the Publish button.
   * `benefitsDocument` is a newly picked file, which the caller uploads once
   * the job exists — its object key is scoped to the job id.
   */
  onSubmit: (
    input: JobWriteInput,
    intent: "draft" | "publish",
    benefitsDocument: File | null,
  ) => void;
  isSubmitting: boolean;
  submitLabel: string;
  /** When provided, a Cancel button appears in the sticky action bar. */
  onCancel?: () => void;
  /**
   * False on the admin edit screen, which saves through the admin endpoint and
   * so cannot presign an upload against a company's job.
   */
  canAttachBenefitsDocument?: boolean;
}

function toDefaults(job?: Job): JobFormValues {
  return {
    title: job?.title ?? "",
    description: job?.description ?? "",
    roleCategory: job?.roleCategory ?? "",
    employmentType: job?.employmentType ?? "",
    locationState: job?.locationState ?? "",
    locationCity: job?.locationCity ?? "",
    salaryMin: minorToMajorInput(job?.salaryMinMinor),
    salaryMax: minorToMajorInput(job?.salaryMaxMinor),
    // Older jobs saved before rate period existed default to the common case.
    salaryRatePeriod: job?.salaryRatePeriod ?? "per_year",
    recruiterFee: minorToMajorInput(job?.recruiterFeeMinor),
    // Filled from the company profile once it resolves — it is not stored on
    // the job, so there is nothing to read back here.
    companyName: "",
    ...intakeToFormValues(job?.intake ?? null),
    // Jobs saved before the three-state control only have the boolean, so it
    // seeds the model unless the intake already recorded one.
    workModel: job?.intake?.workModel ?? (job?.isRemote ? "remote" : "on_site"),
  };
}

/** A labelled field cell: label, control, then a hint or its error in one slot. */
function Field({
  label,
  htmlFor,
  optional,
  hint,
  error,
  className,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-[13px] font-semibold text-navy">
        {label}
        {optional && (
          <span className="ml-1 font-normal text-muted-foreground">
            Optional
          </span>
        )}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

/** A titled block in the flat card — the questionnaire's own section headings. */
function Block({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[13px] font-bold text-navy">{title}</h2>
      {intro && (
        <p className="text-xs leading-relaxed text-muted-foreground">{intro}</p>
      )}
      {children}
    </section>
  );
}

/** Segmented On-site / Remote / Hybrid toggle. */
function WorkModelControl({
  value,
  onChange,
}: {
  value: WorkModel;
  onChange: (next: WorkModel) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-secondary/60 p-1">
      {WORK_MODELS.map((model) => {
        const active = value === model;
        return (
          <button
            key={model}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(model)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-card text-navy shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {WORK_MODEL_LABELS[model]}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A row of radio options bound to one string value. Native radios rather than a
 * Radix group: these are two- to three-option questions on a long form, and the
 * plain control is both lighter and keyboard-correct for free.
 */
function RadioRow({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (next: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex items-center gap-2 text-sm text-foreground"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="h-4 w-4 accent-primary"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

/** One intake question: its wording, then the answers beneath it. */
function Question({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-navy">{label}</span>
      {children}
    </div>
  );
}

/** A money field with a leading "$" adornment. Numeric-only (digits + one dot). */
const MoneyInput = forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        $
      </span>
      <NumericInput
        decimal
        ref={ref}
        className={cn(CONTROL_HEIGHT, "pl-7", className)}
        {...props}
      />
    </div>
  ),
);
MoneyInput.displayName = "MoneyInput";

export function JobForm({
  job,
  onSubmit,
  isSubmitting,
  submitLabel,
  onCancel,
  canAttachBenefitsDocument = true,
}: JobFormProps) {
  const { data: minFee } = useMinRecruiterFee();
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
    watch,
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: toDefaults(job),
  });

  // The whole form is watched so the live preview reacts as the company types;
  // individual fields are read off the snapshot.
  const values = watch();
  const { workModel, locationState } = values;
  // Same state-scoped city source the explore page uses, so the two stay in
  // step and a company picks from a real, complete list rather than a stub.
  const cityOptions = useStateCities(locationState || undefined);

  const { data: companyProfile } = useMyCompanyProfile();
  const profileName = companyProfile?.companyName ?? "";
  const profileAddress = [
    companyProfile?.addressLine,
    companyProfile?.city,
    companyProfile?.state,
  ]
    .filter(Boolean)
    .join(", ");
  const profileZip = companyProfile?.zip ?? "";
  const profileIndustry = companyProfile?.industry ?? "";
  const profileEmployeeSize = companyProfile?.employeeSize ?? "";
  const profileRevenue = companyProfile?.revenue ?? "";
  // The profile stores the founding year; the job form asks for a duration.
  const profileYearsInBusiness =
    companyProfile?.yearFounded == null
      ? ""
      : String(
          Math.max(0, new Date().getFullYear() - companyProfile.yearFounded),
        );
  const profileWhatTheyDo = companyProfile?.description ?? "";
  // Normalized because the select only matches a canonical code, and a city is
  // only meaningful under a state — carrying one without the other would leave
  // a value the disabled city picker cannot show or change.
  const profileState = toUsStateCode(companyProfile?.state);
  const profileCity = profileState === "" ? "" : (companyProfile?.city ?? "");

  // The company name is not editable, so it tracks the profile on an edit too —
  // a renamed company should not keep showing its old name on an old job.
  useEffect(() => {
    if (profileName !== "") setValue("companyName", profileName);
    // Runs once the profile resolves; `setValue` is stable across renders.
  }, [profileName, setValue]);

  // A new job's location defaults to the account's address — most roles sit
  // there, and a multi-site employer edits it. Skipped when editing, so a
  // stored location is never overwritten. The profile's state and city come
  // from the same StateSelect/CityCombobox sources these fields use, so the
  // values are always valid options here.
  useEffect(() => {
    if (job) return;
    if (profileAddress !== "") setValue("worksiteAddress", profileAddress);
    if (profileZip !== "") setValue("worksiteZip", profileZip);
    if (profileState !== "") setValue("locationState", profileState);
    if (profileCity !== "") setValue("locationCity", profileCity);
  }, [job, profileAddress, profileZip, profileState, profileCity, setValue]);

  // Company Info answers the same way: the account's profile is the default and
  // each job may override it, since a company describes itself differently for
  // a warehouse role than for a showroom one.
  useEffect(() => {
    if (job) return;
    if (profileIndustry !== "")
      setValue("companyDetails.industry", profileIndustry);
    if (profileEmployeeSize !== "")
      setValue("companyDetails.employeeSize", profileEmployeeSize);
    if (profileRevenue !== "")
      setValue("companyDetails.revenue", profileRevenue);
    if (profileYearsInBusiness !== "")
      setValue("companyDetails.yearsInBusiness", profileYearsInBusiness);
    if (profileWhatTheyDo !== "")
      setValue("companyDetails.whatTheyDo", profileWhatTheyDo);
  }, [
    job,
    profileIndustry,
    profileEmployeeSize,
    profileRevenue,
    profileYearsInBusiness,
    profileWhatTheyDo,
    setValue,
  ]);

  // The benefits document is not a form value: a newly picked file has no
  // object key until it is uploaded, and it can only be uploaded once the job
  // exists. It is held here and handed to the caller at submit.
  const storedBenefitsDocument = job?.intake?.benefitsAttachment;
  const [benefitsDocument, setBenefitsDocument] =
    useState<BenefitsDocumentState>(
      storedBenefitsDocument
        ? { status: "saved", attachment: storedBenefitsDocument }
        : { status: "empty" },
    );
  const [benefitsDocumentMessage, setBenefitsDocumentMessage] = useState<
    string | null
  >(null);

  const pickBenefitsDocument = (next: BenefitsDocumentState) => {
    const rejection =
      next.status === "selected" ? benefitsDocumentError(next.file) : null;
    setBenefitsDocumentMessage(rejection);
    // A rejected file is not taken: holding it would leave the field naming a
    // document the job will never get, and would discard the one it has.
    if (rejection === null) setBenefitsDocument(next);
  };

  // "empty" is the company removing it. Otherwise the job keeps whatever it
  // already has, and a freshly picked file replaces that once its upload lands.
  const benefitsAttachmentToWrite =
    benefitsDocument.status === "empty" ? undefined : storedBenefitsDocument;

  // Default open so first-time posters see the preview; the choice then sticks.
  const [previewOpen, setPreviewOpen] = useState(true);
  useEffect(() => {
    const stored = localStorage.getItem(PREVIEW_OPEN_KEY);
    if (stored !== null) setPreviewOpen(stored === "true");
  }, []);
  const togglePreview = () =>
    setPreviewOpen((open) => {
      const next = !open;
      localStorage.setItem(PREVIEW_OPEN_KEY, String(next));
      return next;
    });

  const feeMinor = majorInputToMinor(values.recruiterFee);
  const feeMeetsMinimum =
    minFee != null && feeMinor != null && feeMinor >= minFee.amountMinor;
  // The floor is checked on every keystroke, like the "meets the minimum" pill
  // beside it, rather than only when a submit is blocked. An empty field is
  // left to the schema, so the error is not there on arrival.
  const feeError =
    errors.recruiterFee?.message ??
    (minFee != null && feeMinor != null && !feeMeetsMinimum
      ? feeFloorMessage(minFee.amountMinor)
      : null);

  // Required-for-publish completeness, surfaced in the sticky bar status. Read
  // off the schema rather than a hand-kept list, which drifted every time a
  // field became required and left the bar reading "Ready to publish" over a
  // form submit would reject. The form already re-renders on every keystroke
  // for the live preview, so the parse rides along.
  const parsed = jobFormSchema.safeParse(values);
  const incompleteFields = parsed.success
    ? new Set<string>()
    : new Set(parsed.error.issues.map((issue) => issue.path.join(".")));
  // The fee floor is deliberately outside the schema (see `emit`), so the bar
  // has to add it or it would read as ready over a fee the API will refuse.
  if (minFee != null && !feeMeetsMinimum) {
    incompleteFields.add("recruiterFee");
  }
  const remaining = incompleteFields.size;

  // Word count from the description's plain text, for the writing hint.
  const wordCount = values.description
    .replace(/<[^>]*>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const toInput = (formValues: JobFormValues): JobWriteInput => ({
    title: formValues.title,
    // Sanitized at save as well as render — the editor is not a boundary.
    description:
      formValues.description === ""
        ? undefined
        : sanitizeRichText(formValues.description),
    roleCategory: formValues.roleCategory,
    employmentType:
      formValues.employmentType === "" ? undefined : formValues.employmentType,
    locationState:
      formValues.locationState === ""
        ? undefined
        : formValues.locationState.toUpperCase(),
    locationCity:
      formValues.locationCity === "" ? undefined : formValues.locationCity,
    // Derived: a hybrid role has a worksite, so only a fully remote one reads
    // as remote to the job map and the recruiter filters.
    isRemote: formValues.workModel === "remote",
    salaryMinMinor: majorInputToMinor(formValues.salaryMin),
    salaryMaxMinor: majorInputToMinor(formValues.salaryMax),
    salaryRatePeriod: formValues.salaryRatePeriod,
    // Required by the schema, so a plain conversion is safe here.
    recruiterFeeMinor: majorToMinor(Number(formValues.recruiterFee)),
    intake: toIntakeInput(
      formValues,
      job?.intake ?? null,
      benefitsAttachmentToWrite,
    ),
  });

  // Which action fired: the primary save (Enter or "Save") vs. "Publish".
  // The fee floor is checked here rather than in the schema: it is an
  // admin-tunable marketplace policy the API serves, so the figure must not be
  // hardcoded into the form's validation.
  const emit = (intent: "draft" | "publish") =>
    handleSubmit((formValues) => {
      if (minFee != null && (feeMinor ?? 0) < minFee.amountMinor) {
        setError("recruiterFee", {
          message: feeFloorMessage(minFee.amountMinor),
        });
        return;
      }
      onSubmit(
        toInput(formValues),
        intent,
        benefitsDocument.status === "selected" ? benefitsDocument.file : null,
      );
    });

  const statusText = job
    ? "Changes are live as soon as you save."
    : remaining === 0
      ? "Ready to publish. Recruiters are notified immediately."
      : `${remaining} field${remaining === 1 ? "" : "s"} left before you can publish.`;

  // The two free-text benefit inputs sit inline in the grid, with no room for a
  // message each; whichever is wrong reports under the block.
  const benefitsError =
    errors.benefits?.retirement401kMatch?.message ??
    errors.benefits?.ancillaryDetails?.message;

  const benefitToggle = (key: BenefitKey) => (
    <Controller
      control={control}
      name={`benefits.${key}`}
      render={({ field }) => (
        <label className="flex items-center gap-2.5 text-sm text-foreground">
          <Checkbox
            checked={field.value}
            onCheckedChange={(checked) => field.onChange(checked === true)}
          />
          {BENEFIT_LABELS.get(key) ?? key}
        </label>
      )}
    />
  );

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* The form takes ~70% and the preview ~30% of the row (flex 7:3). */}
      <form
        onSubmit={emit("draft")}
        className="flex min-w-0 flex-col gap-4 lg:flex-[7]"
      >
        <div className="divide-y divide-border rounded-md border border-border bg-card shadow-card">
          <FormSection
            title="Basics"
            hint="The role itself — what it is called, how it is employed, and why the seat is open."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Read-only: the name recruiters see is the account's, not a
                per-job value. Still registered so it is snapshotted onto the
                job's intake at save. */}
              <Field label="Company Name" htmlFor="companyName">
                <Input
                  id="companyName"
                  readOnly
                  tabIndex={-1}
                  className={cn(
                    CONTROL_HEIGHT,
                    "cursor-default bg-secondary/60 text-muted-foreground focus-visible:ring-0",
                  )}
                  {...register("companyName")}
                />
              </Field>
              <Field
                label="Job Title"
                htmlFor="title"
                error={errors.title?.message}
              >
                <Input
                  id="title"
                  className={CONTROL_HEIGHT}
                  placeholder="e.g., Senior Software Engineer"
                  {...register("title")}
                />
              </Field>

              <Field
                label="Role Category"
                htmlFor="roleCategory"
                error={errors.roleCategory?.message}
              >
                <Controller
                  control={control}
                  name="roleCategory"
                  render={({ field }) => (
                    <Select
                      value={field.value === "" ? undefined : field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="roleCategory"
                        className={CONTROL_HEIGHT}
                      >
                        <SelectValue placeholder="Select role category" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {ROLE_CATEGORY_LABELS[category]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field
                label="Employment Type"
                htmlFor="employmentType"
                error={errors.employmentType?.message}
              >
                <Controller
                  control={control}
                  name="employmentType"
                  render={({ field }) => (
                    <Select
                      value={field.value === "" ? undefined : field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="employmentType"
                        className={CONTROL_HEIGHT}
                      >
                        <SelectValue placeholder="Select employment type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EMPLOYMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {EMPLOYMENT_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>

            <Question label="Why is This Position Open?">
              <Controller
                control={control}
                name="positionOpenReason"
                render={({ field }) => (
                  <RadioRow
                    name="positionOpenReason"
                    value={field.value}
                    onChange={field.onChange}
                    options={POSITION_OPEN_REASONS.map((reason) => ({
                      value: reason,
                      label: POSITION_OPEN_REASON_LABELS[reason],
                    }))}
                  />
                )}
              />
              {/* Only meaningful against a current employee's seat — the
                write path drops it for the other answers. */}
              {values.positionOpenReason === "replacing_current" && (
                <Controller
                  control={control}
                  name="confidentialSearch"
                  render={({ field }) => (
                    <label className="mt-1 flex items-center gap-2.5 text-sm text-foreground">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(checked === true)
                        }
                      />
                      Confidential Search?
                    </label>
                  )}
                />
              )}
            </Question>
          </FormSection>

          <FormSection
            title="Company Info"
            hint="Prefilled from your company profile — edit if this role falls under a different business segment."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Industry"
                htmlFor="companyIndustry"
                error={errors.companyDetails?.industry?.message}
              >
                <Input
                  id="companyIndustry"
                  className={CONTROL_HEIGHT}
                  placeholder="e.g., Home Furnishings"
                  {...register("companyDetails.industry")}
                />
              </Field>
              <Field
                label="Employee Size"
                htmlFor="companyEmployeeSize"
                error={errors.companyDetails?.employeeSize?.message}
              >
                <Controller
                  control={control}
                  name="companyDetails.employeeSize"
                  render={({ field }) => (
                    <Select
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="companyEmployeeSize"
                        className={CONTROL_HEIGHT}
                      >
                        <SelectValue placeholder="Select a range" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANY_SIZE_OPTIONS.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field
                label="Annual Revenue"
                htmlFor="companyRevenue"
                error={errors.companyDetails?.revenue?.message}
              >
                <NumericInput
                  decimal
                  id="companyRevenue"
                  className={CONTROL_HEIGHT}
                  placeholder="e.g., 50000000"
                  {...register("companyDetails.revenue")}
                />
              </Field>
              <Field
                label="Years In Business"
                htmlFor="companyYearsInBusiness"
                error={errors.companyDetails?.yearsInBusiness?.message}
              >
                <NumericInput
                  id="companyYearsInBusiness"
                  className={CONTROL_HEIGHT}
                  placeholder="e.g., 12"
                  {...register("companyDetails.yearsInBusiness")}
                />
              </Field>
            </div>
            <Field
              label="What You Do"
              htmlFor="companyWhatTheyDo"
              error={errors.companyDetails?.whatTheyDo?.message}
            >
              <Textarea
                id="companyWhatTheyDo"
                rows={3}
                placeholder="What the company does, in your own words."
                {...register("companyDetails.whatTheyDo")}
              />
            </Field>
          </FormSection>

          <FormSection
            title="Location"
            hint="Where the work happens, and the schedule it runs on."
          >
            <Field label="Work Model">
              <div className="flex flex-wrap items-center gap-3">
                <Controller
                  control={control}
                  name="workModel"
                  render={({ field }) => (
                    <WorkModelControl
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {/* Only a hybrid role has on-site days to state. */}
                {workModel === "hybrid" && (
                  <div className="flex items-center gap-2">
                    <NumericInput
                      aria-label="Days on site per week"
                      className="h-9 w-14"
                      {...register("onsiteDaysPerWeek")}
                    />
                    <span className="text-sm text-muted-foreground">
                      days on site / week
                    </span>
                  </div>
                )}
              </div>
              {errors.onsiteDaysPerWeek && (
                <p className="text-xs text-destructive">
                  {errors.onsiteDaysPerWeek.message}
                </p>
              )}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Worksite Street Address"
                htmlFor="worksiteAddress"
                optional={workModel === "remote"}
                error={errors.worksiteAddress?.message}
              >
                <Input
                  id="worksiteAddress"
                  className={CONTROL_HEIGHT}
                  placeholder="e.g., 123 Market St"
                  {...register("worksiteAddress")}
                />
              </Field>
              <Field
                label="Worksite ZIP"
                htmlFor="worksiteZip"
                optional={workModel === "remote"}
                error={errors.worksiteZip?.message}
              >
                <NumericInput
                  id="worksiteZip"
                  className={CONTROL_HEIGHT}
                  placeholder="e.g., 94103"
                  {...register("worksiteZip")}
                />
              </Field>
              {/* State and City are columns on the job, not a repeat of the
                  worksite address above: the live map groups by them and the
                  explore filters query them, so the hint says as much. */}
              <Field
                label="State"
                htmlFor="locationState"
                optional={workModel === "remote"}
                hint="Places this role on the live map and in recruiter search filters."
                error={errors.locationState?.message}
              >
                <Controller
                  control={control}
                  name="locationState"
                  render={({ field }) => (
                    <StateSelect
                      id="locationState"
                      className={CONTROL_HEIGHT}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Field>
              {/* The same searchable, state-scoped city picker the explore map
                  uses, so the job's city matches the values recruiters filter
                  by. Disabled until a state is chosen. */}
              <Field
                label="City"
                optional={workModel === "remote"}
                error={errors.locationCity?.message}
              >
                <Controller
                  control={control}
                  name="locationCity"
                  render={({ field }) => (
                    <CityCombobox
                      cities={cityOptions}
                      value={field.value === "" ? null : field.value}
                      onChange={(city) => field.onChange(city ?? "")}
                      disabled={!locationState}
                    />
                  )}
                />
              </Field>
              <Field
                label="Days & Hours"
                htmlFor="daysAndHours"
                className="sm:col-span-2"
                error={
                  errors.daysAndHours?.days?.message ??
                  errors.daysAndHours?.startHour?.message ??
                  errors.daysAndHours?.endHour?.message
                }
              >
                <Controller
                  control={control}
                  name="daysAndHours"
                  render={({ field }) => (
                    <DaysAndHoursField
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection
            title="Compensation & Benefits"
            hint="What the role pays, what comes with it, and the fee you are offering recruiters."
          >
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-[13px] font-semibold text-navy">
                  Pay Range
                </Label>
                <Controller
                  control={control}
                  name="salaryRatePeriod"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(period) => {
                        field.onChange(period);
                        // A yearly band and an hourly one live on scales 1000x
                        // apart, so carrying the figures across reads as a
                        // nonsense range. Clearing them returns the slider to
                        // the new period's full span.
                        setValue("salaryMin", "", { shouldDirty: true });
                        setValue("salaryMax", "", { shouldDirty: true });
                      }}
                    >
                      <SelectTrigger
                        aria-label="Pay Type"
                        className="h-7 w-auto gap-1 border-none bg-secondary/60 px-2 text-xs shadow-none"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SALARY_RATE_PERIODS.map((period) => (
                          <SelectItem key={period} value={period}>
                            {SALARY_RATE_PERIOD_LABELS[period]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <PayRangeField
                min={values.salaryMin}
                max={values.salaryMax}
                ratePeriod={values.salaryRatePeriod}
                onChange={(next) => {
                  // From the slider: mark dirty so the sticky bar and the
                  // preview react the same as they do to typing.
                  setValue("salaryMin", next.min, { shouldDirty: true });
                  setValue("salaryMax", next.max, { shouldDirty: true });
                }}
              >
                <div className="flex items-center gap-2">
                  <MoneyInput
                    aria-label="Pay minimum"
                    placeholder="Min"
                    {...register("salaryMin")}
                  />
                  <span className="text-muted-foreground">–</span>
                  <MoneyInput
                    aria-label="Pay maximum"
                    placeholder="Max"
                    {...register("salaryMax")}
                  />
                </div>
              </PayRangeField>
              {(errors.salaryMin || errors.salaryMax) && (
                <p className="text-xs text-destructive">
                  {errors.salaryMin?.message ?? errors.salaryMax?.message}
                </p>
              )}
            </div>

            <Block title="Benefits Provided">
              <div className="grid gap-x-4 gap-y-3 sm:grid-cols-3">
                {benefitToggle("medical")}
                {benefitToggle("dental")}
                {benefitToggle("vision")}

                <div className="flex items-center gap-2">
                  <Controller
                    control={control}
                    name="benefits.retirement401k"
                    render={({ field }) => (
                      <label className="flex items-center gap-2.5 text-sm text-foreground">
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) =>
                            field.onChange(checked === true)
                          }
                        />
                        401K/403B
                      </label>
                    )}
                  />
                  {/* Typing a figure is itself the answer, so it ticks the box:
                    an unticked 401(k) drops the match on save. */}
                  <NumericInput
                    decimal
                    aria-label="401K/403B match percent"
                    className="h-8 w-14"
                    onFocus={() =>
                      setValue("benefits.retirement401k", true, {
                        shouldDirty: true,
                      })
                    }
                    {...register("benefits.retirement401kMatch")}
                  />
                  <span className="text-sm text-muted-foreground">
                    (% Match)
                  </span>
                </div>
                {/* Day counts sit beside their own checkbox and tick it on focus,
                  the same way the 401K match does. */}
                <div className="flex items-center gap-2">
                  {benefitToggle("sickTime")}
                  <NumericInput
                    aria-label="Sick days"
                    className="h-8 w-14"
                    onFocus={() =>
                      setValue("benefits.sickTime", true, { shouldDirty: true })
                    }
                    {...register("benefits.sickDays")}
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
                <div className="flex items-center gap-2">
                  {benefitToggle("vacation")}
                  <NumericInput
                    aria-label="Vacation days"
                    className="h-8 w-14"
                    onFocus={() =>
                      setValue("benefits.vacation", true, { shouldDirty: true })
                    }
                    {...register("benefits.vacationDays")}
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>

                <Controller
                  control={control}
                  name="benefits.educationReimbursement"
                  render={({ field }) => (
                    <label className="flex items-center gap-2.5 text-sm text-foreground">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(checked === true)
                        }
                      />
                      Education Reimbursement
                    </label>
                  )}
                />
                {/* Last, and spanning the remaining columns: its free-text box
                  needs the room the single-word checkboxes do not. */}
                <div className="flex items-center gap-2.5 sm:col-span-2">
                  <Controller
                    control={control}
                    name="benefits.ancillary"
                    render={({ field }) => (
                      <label className="flex shrink-0 items-center gap-2.5 text-sm text-foreground">
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) =>
                            field.onChange(checked === true)
                          }
                        />
                        Other Benefits
                      </label>
                    )}
                  />
                  <Input
                    aria-label="Other benefits"
                    className="h-8"
                    onFocus={() =>
                      setValue("benefits.ancillary", true, {
                        shouldDirty: true,
                      })
                    }
                    {...register("benefits.ancillaryDetails")}
                  />
                </div>
              </div>
              {benefitsError && (
                <p className="text-xs text-destructive">{benefitsError}</p>
              )}

              <Field
                label="Benefits Summary"
                htmlFor="benefitsSummary"
                optional
                error={errors.benefitsSummary?.message}
              >
                <Textarea
                  id="benefitsSummary"
                  rows={3}
                  placeholder="Anything worth calling out beyond the boxes above."
                  {...register("benefitsSummary")}
                />
              </Field>

              {/* Nothing to show on a surface that can neither attach nor
                  display one, which would leave a bare label behind. */}
              {(canAttachBenefitsDocument ||
                benefitsDocument.status !== "empty") && (
                <Field
                  label="Benefits Document"
                  htmlFor="benefitsAttachment"
                  optional
                >
                  <BenefitsAttachmentField
                    value={benefitsDocument}
                    onChange={pickBenefitsDocument}
                    canAttach={canAttachBenefitsDocument}
                    error={benefitsDocumentMessage}
                  />
                </Field>
              )}
            </Block>

            {/* The recruiter fee is the money that drives the marketplace, so it
              gets its own emphasized panel. */}
            <div className="rounded-lg bg-secondary/50 p-4">
              <div className="flex items-center gap-1.5">
                <Label
                  htmlFor="recruiterFee"
                  className="text-[13px] font-semibold text-navy"
                >
                  Recruiter Fee
                </Label>
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label="Why the fee is fixed"
                        className="text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      You can&rsquo;t change the fee once the job is posted.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <MoneyInput
                  id="recruiterFee"
                  placeholder="10000"
                  className="max-w-[12rem] bg-card"
                  {...register("recruiterFee")}
                />
                {/* One slot, two states: the fee either clears the floor or
                    says by how much it misses, in the same pill shape. */}
                {feeError !== null ? (
                  <span
                    role="alert"
                    className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700"
                  >
                    {feeError}
                  </span>
                ) : (
                  feeMeetsMinimum && (
                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      Meets the publishing minimum
                    </span>
                  )
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {minFee ? (
                  <>
                    A minimum recruiter fee of{" "}
                    <span className="font-semibold text-navy">
                      {formatMinor(minFee.amountMinor)}
                    </span>{" "}
                    is required to publish any role. The higher the fee, the
                    more attention your job will get from recruiters &mdash; and
                    faster candidates for you.
                  </>
                ) : (
                  "Paid only on a successful hire."
                )}
              </p>
            </div>
          </FormSection>

          <FormSection
            title="Position Details"
            hint="The overview of the position and what you want to see in your inbox. The more details the better - recruiters and candidates use this information to determine the right long-term fit."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Reports To"
                htmlFor="reportsTo"
                error={errors.reportsTo?.message}
              >
                <Input
                  id="reportsTo"
                  className={CONTROL_HEIGHT}
                  placeholder="Title this role reports to"
                  {...register("reportsTo")}
                />
              </Field>
            </div>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <RichTextEditor
                  id="description"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Add Job Duties, Qualifications and Requirements info here."
                />
              )}
            />
            <div className="flex items-center justify-end text-xs text-muted-foreground">
              <span className="shrink-0 tabular-nums">
                {wordCount} {wordCount === 1 ? "word" : "words"}
              </span>
            </div>
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Must Haves" htmlFor="mustHave">
                <Controller
                  control={control}
                  name="mustHave"
                  render={({ field }) => (
                    <ChipListField
                      id="mustHave"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="e.g., specific skills, industry, software, education..."
                      ariaLabel="Add a must-have"
                      max={MAX_QUALIFICATIONS}
                      maxLength={MAX_QUALIFICATION_LENGTH}
                    />
                  )}
                />
              </Field>
              <Field label="Nice to Haves" htmlFor="niceToHave">
                <Controller
                  control={control}
                  name="niceToHave"
                  render={({ field }) => (
                    <ChipListField
                      id="niceToHave"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="e.g., specific skills, industry, software, education..."
                      ariaLabel="Add a nice-to-have"
                      max={MAX_QUALIFICATIONS}
                      maxLength={MAX_QUALIFICATION_LENGTH}
                    />
                  )}
                />
              </Field>
            </div>

            <Block
              title="Top 3 Keys You Will Make a Hiring Decision Based On"
              intro="The three things that actually decide it. Recruiters screen against these."
            >
              <Controller
                control={control}
                name="selectionKeys"
                render={({ field }) => (
                  <div className="grid gap-2.5">
                    {Array.from({ length: MAX_SELECTION_KEYS }, (_, index) => (
                      <div key={index} className="flex items-center gap-2.5">
                        <span className="w-4 shrink-0 text-sm font-medium text-navy">
                          {index + 1}.
                        </span>
                        <Input
                          aria-label={`Hiring decision key ${index + 1}`}
                          className={CONTROL_HEIGHT}
                          value={field.value[index] ?? ""}
                          onChange={(event) => {
                            // A fixed three rows over a sparse array, so typing in
                            // row 3 first does not collapse into row 1.
                            const next = Array.from(
                              { length: MAX_SELECTION_KEYS },
                              (_, position) => field.value[position] ?? "",
                            );
                            next[index] = event.target.value;
                            field.onChange(next);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              />
            </Block>
          </FormSection>

          <FormSection
            title="Timeline & Strategy"
            hint="How quickly you want to hire, the interview process you run, and how else this role is being sourced."
          >
            <div className="flex flex-col gap-3">
              <Question label="Availability for Interviewing?">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <Controller
                    control={control}
                    name="interviewingAsap"
                    render={({ field }) => (
                      <>
                        <label className="flex items-center gap-2 text-sm text-foreground">
                          <input
                            type="radio"
                            name="interviewingAsap"
                            checked={field.value}
                            onChange={() => field.onChange(true)}
                            className="h-4 w-4 accent-primary"
                          />
                          ASAP
                        </label>
                        {/* The dates stay enabled and sit outside the radio's
                            label: reaching for one is how you choose a range,
                            and a disabled input swallows the click that would
                            otherwise select it. */}
                        <div className="flex items-center gap-1.5">
                          <input
                            type="radio"
                            name="interviewingAsap"
                            aria-label="A date range"
                            checked={!field.value}
                            onChange={() => field.onChange(false)}
                            className="h-4 w-4 accent-primary"
                          />
                          <Input
                            type="date"
                            aria-label="Interviewing from"
                            className="h-8 w-auto"
                            onFocus={() => field.onChange(false)}
                            {...register("interviewingFrom")}
                          />
                          <span className="text-muted-foreground">–</span>
                          <Input
                            type="date"
                            aria-label="Interviewing until"
                            className="h-8 w-auto"
                            onFocus={() => field.onChange(false)}
                            {...register("interviewingTo")}
                          />
                        </div>
                      </>
                    )}
                  />
                </div>
                {errors.interviewingTo && (
                  <p className="text-xs text-destructive">
                    {errors.interviewingTo.message}
                  </p>
                )}
              </Question>

              <Question label="When Do You Hope to Make an Offer?">
                <Controller
                  control={control}
                  name="timelineToHire"
                  render={({ field }) => (
                    <RadioRow
                      name="timelineToHire"
                      value={field.value}
                      onChange={field.onChange}
                      options={OFFER_TIMELINES.map((timeline) => ({
                        value: timeline,
                        label: OFFER_TIMELINE_QUESTION_LABELS[timeline],
                      }))}
                    />
                  )}
                />
              </Question>

              <Question label="Interview Process">
                <Controller
                  control={control}
                  name="interviewRounds"
                  render={({ field }) => (
                    <div className="flex flex-wrap items-center gap-2">
                      {field.value.map((round, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-0.5 rounded-md border border-border bg-secondary/40 py-1 pl-2.5 pr-1"
                        >
                          <span className="text-sm font-medium text-navy">
                            {index + 1}.
                          </span>
                          <Select
                            value={round.type}
                            onValueChange={(type) =>
                              field.onChange(
                                field.value.map((existing, position) =>
                                  position === index
                                    ? { ...existing, type }
                                    : existing,
                                ),
                              )
                            }
                          >
                            <SelectTrigger
                              aria-label={`Round ${index + 1} type`}
                              className="h-7 w-auto gap-1 border-none bg-transparent px-1.5 text-sm shadow-none"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {INTERVIEW_TYPE_OPTIONS.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {INTERVIEW_TYPE_LABELS[type]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={round.durationMinutes}
                            onValueChange={(durationMinutes) =>
                              field.onChange(
                                field.value.map((existing, position) =>
                                  position === index
                                    ? { ...existing, durationMinutes }
                                    : existing,
                                ),
                              )
                            }
                          >
                            <SelectTrigger
                              aria-label={`Round ${index + 1} length`}
                              className="h-7 w-auto gap-1 border-none bg-transparent px-1.5 text-sm shadow-none"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {INTERVIEW_DURATIONS.map((duration) => (
                                <SelectItem
                                  key={duration.minutes}
                                  value={String(duration.minutes)}
                                >
                                  {duration.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <button
                            type="button"
                            aria-label={`Remove round ${index + 1}`}
                            onClick={() =>
                              field.onChange(
                                field.value.filter(
                                  (_, position) => position !== index,
                                ),
                              )
                            }
                            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      {field.value.length < MAX_INTERVIEW_STAGES && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            field.onChange([
                              ...field.value,
                              { type: "phone", durationMinutes: "30" },
                            ])
                          }
                        >
                          + Add a round
                        </Button>
                      )}
                    </div>
                  )}
                />
              </Question>

              <Question label="Is This Position Posted Online?">
                <Controller
                  control={control}
                  name="postedOnline"
                  render={({ field }) => (
                    <RadioRow
                      name="postedOnline"
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        { value: "yes", label: "Yes" },
                        { value: "no", label: "No" },
                      ]}
                    />
                  )}
                />
              </Question>

              <Question label="Do You Have Any Other Means for Sourcing This Role?">
                <Controller
                  control={control}
                  name="otherSourcing"
                  render={({ field }) => (
                    <RadioRow
                      name="otherSourcing"
                      value={field.value}
                      onChange={field.onChange}
                      options={OTHER_SOURCING_OPTIONS.map((option) => ({
                        value: option,
                        label: OTHER_SOURCING_LABELS[option],
                      }))}
                    />
                  )}
                />
              </Question>
            </div>
          </FormSection>
        </div>

        {/* Sticky action bar so Save is always reachable in a long form. */}
        <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-md border border-border bg-card/95 px-4 py-3 shadow-card-lg backdrop-blur sm:px-5">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                job || remaining === 0 ? "bg-emerald-500" : "bg-amber-400",
              )}
            />
            <span className="hidden sm:inline">{statusText}</span>
          </span>
          <div className="flex gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            {job ? (
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : submitLabel}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={emit("draft")}
                  disabled={isSubmitting}
                >
                  Save as draft
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={emit("publish")}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Working…" : "Publish job"}
                </Button>
              </>
            )}
          </div>
        </div>
      </form>

      {/* The preview is a right sidebar: open, it tracks the form as a sticky
            panel; collapsed, it shrinks to a thin rail on the right edge that
            reopens it. On narrow screens it drops below the form. */}
      {previewOpen ? (
        <aside className="w-full min-w-0 lg:sticky lg:top-24 lg:flex-[3]">
          <JobLivePreview
            values={values}
            status={job?.status ?? "draft"}
            onCollapse={togglePreview}
          />
        </aside>
      ) : (
        <aside className="shrink-0 lg:sticky lg:top-24">
          <button
            type="button"
            onClick={togglePreview}
            aria-label="Show preview"
            className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2.5 text-sm font-medium text-navy shadow-sm transition-colors hover:bg-accent lg:w-auto lg:flex-col lg:gap-3 lg:px-2.5 lg:py-4"
          >
            <PanelRightOpen className="h-4 w-4 shrink-0 text-primary" />
            <span className="lg:[writing-mode:vertical-rl]">Preview</span>
          </button>
        </aside>
      )}
    </div>
  );
}
