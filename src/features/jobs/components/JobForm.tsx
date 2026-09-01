"use client";

import { forwardRef, useEffect, useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Info, PanelRightOpen, X } from "lucide-react";
import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui-components/controls/tooltip";
import { RichTextEditor } from "@/shared/ui-components/controls/RichTextEditor";
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
  COMPANY_DETAIL_FIELDS,
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  INTERVIEW_DURATIONS,
  INTERVIEW_TYPES,
  INTERVIEW_TYPE_LABELS,
  MAX_INTERVIEW_STAGES,
  MAX_QUALIFICATIONS,
  MAX_QUALIFICATION_LENGTH,
  OFFER_TIMELINES,
  OFFER_TIMELINE_QUESTION_LABELS,
  OTHER_SOURCING_LABELS,
  OTHER_SOURCING_OPTIONS,
  ROLE_CATEGORIES,
  ROLE_CATEGORY_LABELS,
  SALARY_RATE_PERIODS,
  SALARY_RATE_PERIOD_LABELS,
  jobFormSchema,
  type Job,
  type JobFormValues,
} from "../schemas";
import { intakeToFormValues, toIntakeInput } from "../utils/jobIntake";
import { PayRangeField } from "./PayRangeField";
import { ChipListField } from "@/shared/ui-components/controls/ChipListField";
import { Checkbox } from "@/shared/ui-components/controls/checkbox";
import { useMyCompanyProfile } from "@/features/companies";
import type { JobWriteInput } from "../api/jobs";
import { useStateCities } from "@/shared/hooks/useStateCities";
import { CityCombobox } from "@/shared/ui-components/controls/CityCombobox";
import { StateSelect } from "@/shared/ui-components/controls/StateSelect";
import { JobLivePreview } from "./JobLivePreview";

/** Persists the live-preview open/closed choice across navigations and reloads. */
const PREVIEW_OPEN_KEY = "hh-job-preview-open";

/** Consistent control height across the form's dense single-card layout. */
const CONTROL_HEIGHT = "h-10";

type BenefitKey = (typeof BENEFIT_CHECKBOXES)[number]["key"];

/** The benefit grid places its cells by hand to match the intake layout, so the
 * shared label list is read by key rather than mapped in its own order. */
const BENEFIT_LABELS = new Map<BenefitKey, string>(
  BENEFIT_CHECKBOXES.map((benefit) => [benefit.key, benefit.label]),
);

interface JobFormProps {
  job?: Job;
  /** `intent` is "draft" for a plain save and "publish" for the Publish button. */
  onSubmit: (input: JobWriteInput, intent: "draft" | "publish") => void;
  isSubmitting: boolean;
  submitLabel: string;
  /** When provided, a Cancel button appears in the sticky action bar. */
  onCancel?: () => void;
}

function toDefaults(job?: Job): JobFormValues {
  return {
    title: job?.title ?? "",
    description: job?.description ?? "",
    roleCategory: job?.roleCategory ?? "engineering",
    employmentType: job?.employmentType ?? "",
    locationState: job?.locationState ?? "",
    locationCity: job?.locationCity ?? "",
    isRemote: job?.isRemote ?? false,
    salaryMin: minorToMajorInput(job?.salaryMinMinor),
    salaryMax: minorToMajorInput(job?.salaryMaxMinor),
    // Older jobs saved before rate period existed default to the common case.
    salaryRatePeriod: job?.salaryRatePeriod ?? "per_year",
    recruiterFee: minorToMajorInput(job?.recruiterFeeMinor),
    // Filled from the company profile once it resolves — it is not stored on
    // the job, so there is nothing to read back here.
    companyName: "",
    ...intakeToFormValues(job?.intake ?? null),
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

/** Segmented On-site / Remote toggle, bound to the `isRemote` boolean. */
function WorkModelControl({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (isRemote: boolean) => void;
}) {
  const options = [
    { label: "On-site", isRemote: false },
    { label: "Remote", isRemote: true },
  ] as const;
  return (
    <div className="inline-flex rounded-lg border border-border bg-secondary/60 p-1">
      {options.map((option) => {
        const active = value === option.isRemote;
        return (
          <button
            key={option.label}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.isRemote)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-card text-navy shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
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

/** A money field with a leading "$" adornment. */
const MoneyInput = forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        $
      </span>
      <Input
        ref={ref}
        inputMode="decimal"
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
}: JobFormProps) {
  const { data: minFee } = useMinRecruiterFee();
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: toDefaults(job),
  });

  // The whole form is watched so the live preview reacts as the company types;
  // individual fields are read off the snapshot.
  const values = watch();
  const { isRemote, locationState } = values;
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

  // The company name is not editable, so it tracks the profile on an edit too —
  // a renamed company should not keep showing its old name on an old job.
  useEffect(() => {
    if (profileName !== "") setValue("companyName", profileName);
    // Runs once the profile resolves; `setValue` is stable across renders.
  }, [profileName, setValue]);

  // A new job's worksite defaults to the account's address — most roles sit
  // there, and a multi-site employer edits it. Skipped when editing, so a
  // stored address is never overwritten.
  useEffect(() => {
    if (job || profileAddress === "") return;
    setValue("worksiteAddress", profileAddress);
  }, [job, profileAddress, setValue]);

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

  // Required-for-publish completeness, surfaced in the sticky bar status.
  // roleCategory always has a default, so it's not counted.
  const requiredChecks = [
    values.title.trim() !== "",
    values.employmentType !== "",
    values.isRemote || values.locationState !== "",
    values.recruiterFee.trim() !== "",
    values.description.trim() !== "",
  ];
  const remaining = requiredChecks.filter((ok) => !ok).length;

  const feeMinor = majorInputToMinor(values.recruiterFee);
  const feeMeetsMinimum =
    minFee != null && feeMinor != null && feeMinor >= minFee.amountMinor;

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
    isRemote: formValues.isRemote,
    salaryMinMinor: majorInputToMinor(formValues.salaryMin),
    salaryMaxMinor: majorInputToMinor(formValues.salaryMax),
    salaryRatePeriod: formValues.salaryRatePeriod,
    // Required by the schema, so a plain conversion is safe here.
    recruiterFeeMinor: majorToMinor(Number(formValues.recruiterFee)),
    intake: toIntakeInput(formValues, job?.intake ?? null),
  });

  // Which action fired: the primary save (Enter or "Save") vs. "Publish".
  const emit = (intent: "draft" | "publish") =>
    handleSubmit((formValues) => onSubmit(toInput(formValues), intent));

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
        <div className="flex flex-col gap-5 rounded-md border border-border bg-card p-5 shadow-card sm:p-6">
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

            <Field label="Role Category" htmlFor="roleCategory">
              <Controller
                control={control}
                name="roleCategory"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="roleCategory" className={CONTROL_HEIGHT}>
                      <SelectValue placeholder="Select a category" />
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

            <Field
              label="Worksites Address"
              htmlFor="worksiteAddress"
              optional
              error={errors.worksiteAddress?.message}
            >
              <Input
                id="worksiteAddress"
                className={CONTROL_HEIGHT}
                placeholder="e.g., 123 Market St, San Francisco, CA"
                {...register("worksiteAddress")}
              />
            </Field>
            <Field
              label="Days & Hours"
              htmlFor="daysAndHours"
              optional
              error={errors.daysAndHours?.message}
            >
              <Input
                id="daysAndHours"
                className={CONTROL_HEIGHT}
                placeholder="List any expected overtime"
                {...register("daysAndHours")}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Work Model">
              <Controller
                control={control}
                name="isRemote"
                render={({ field }) => (
                  <WorkModelControl
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="State"
                htmlFor="locationState"
                optional={isRemote}
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
              <Field label="City" optional>
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
            </div>
          </div>

          <div className="grid items-start gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-[13px] font-semibold text-navy">
                  Pay Range{" "}
                  <span className="font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>
                <Controller
                  control={control}
                  name="salaryRatePeriod"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        aria-label="Rate period"
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

            <Field
              label="Reports To"
              htmlFor="reportsTo"
              optional
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
              {feeMeetsMinimum && (
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  Meets the publishing minimum
                </span>
              )}
            </div>
            {errors.recruiterFee ? (
              <p className="mt-2 text-xs text-destructive">
                {errors.recruiterFee.message}
              </p>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                {minFee ? (
                  <>
                    A minimum recruiter fee of{" "}
                    <span className="font-semibold text-navy">
                      {formatMinor(minFee.amountMinor)}
                    </span>{" "}
                    is required to publish any role.
                  </>
                ) : (
                  "Paid only on a successful hire."
                )}
              </p>
            )}
          </div>

          <Block title="Benefits Provided">
            <div className="grid gap-x-4 gap-y-3 sm:grid-cols-3">
              {benefitToggle("medical")}
              {benefitToggle("dental")}
              <Controller
                control={control}
                name="benefits.ancillary"
                render={({ field }) => (
                  <label className="flex items-center gap-2.5 text-sm text-foreground">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                    Ancillary Benefits
                  </label>
                )}
              />

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
                      401K
                    </label>
                  )}
                />
                {/* Typing a figure is itself the answer, so it ticks the box:
                    an unticked 401(k) drops the match on save. */}
                <Input
                  aria-label="401K match percent"
                  inputMode="decimal"
                  className="h-8 w-14"
                  onFocus={() =>
                    setValue("benefits.retirement401k", true, {
                      shouldDirty: true,
                    })
                  }
                  {...register("benefits.retirement401kMatch")}
                />
                <span className="text-sm text-muted-foreground">(% Match)</span>
              </div>
              <Input
                aria-label="Ancillary benefit details"
                className="h-8"
                placeholder="List details"
                onFocus={() =>
                  setValue("benefits.ancillary", true, { shouldDirty: true })
                }
                {...register("benefits.ancillaryDetails")}
              />

              {benefitToggle("sickTime")}
              {benefitToggle("vacation")}
            </div>
            {benefitsError && (
              <p className="text-xs text-destructive">{benefitsError}</p>
            )}
          </Block>

          <Block
            title="Company Details"
            intro="Employers submit clear job details so recruiters instantly understand expectations, urgency, and value."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {COMPANY_DETAIL_FIELDS.map((detail) => (
                <Field
                  key={detail.key}
                  label={detail.label}
                  htmlFor={`companyDetails.${detail.key}`}
                  error={errors.companyDetails?.[detail.key]?.message}
                >
                  <Input
                    id={`companyDetails.${detail.key}`}
                    className={CONTROL_HEIGHT}
                    inputMode={
                      detail.key === "yearsInBusiness" ? "numeric" : undefined
                    }
                    placeholder={detail.placeholder}
                    {...register(`companyDetails.${detail.key}`)}
                  />
                </Field>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Provide details for better candidate matching to keep your result.
              All four are saved together.
            </p>
          </Block>

          <Block title="Position Duties">
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <RichTextEditor
                  id="description"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="e.g., list key responsibilities and tasks..."
                />
              )}
            />
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>Roles with 300+ words get 2x more recruiter interest.</span>
              <span className="shrink-0 tabular-nums">
                {wordCount} {wordCount === 1 ? "word" : "words"}
              </span>
            </div>
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </Block>

          <Block title="Qualifications (List Must Haves vs Nice to Haves)">
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
                      placeholder="e.g., specific skills, education, years of experience..."
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
                      placeholder="e.g., AWS, startup experience..."
                      ariaLabel="Add a nice-to-have"
                      max={MAX_QUALIFICATIONS}
                      maxLength={MAX_QUALIFICATION_LENGTH}
                    />
                  )}
                />
              </Field>
            </div>
          </Block>

          <Block title="Interview Process">
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
                          {INTERVIEW_TYPES.map((type) => (
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
          </Block>

          <Block title="Timeline & Sourcing">
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
          </Block>
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
