"use client";

import { forwardRef, useEffect, useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Info, PanelRightOpen } from "lucide-react";
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
import { US_STATES } from "@/shared/data/usStatesGeo";
import { sanitizeRichText } from "@/shared/libs/richText";
import {
  formatMinor,
  majorInputToMinor,
  majorToMinor,
  minorToMajorInput,
} from "@/shared/utils/money";
import {
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  ROLE_CATEGORIES,
  ROLE_CATEGORY_LABELS,
  SALARY_RATE_PERIODS,
  SALARY_RATE_PERIOD_LABELS,
  jobFormSchema,
  type Job,
  type JobFormValues,
} from "../schemas";
import type { JobWriteInput } from "../api/jobs";
import { useStateCities } from "../hooks/useStateCities";
import { CityCombobox } from "./CityCombobox";
import { JobLivePreview } from "./JobLivePreview";

/** Persists the live-preview open/closed choice across navigations and reloads. */
const PREVIEW_OPEN_KEY = "hh-job-preview-open";

/** Consistent, spacious control height across the form (matches the reference). */
const CONTROL_HEIGHT = "h-11";

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
  };
}

/** A numbered form section: step badge + title + hint on the left, fields right. */
function StepSection({
  step,
  title,
  hint,
  children,
}: {
  step: number;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-x-8 gap-y-4 p-5 sm:p-6 md:grid-cols-[minmax(0,15rem)_1fr]">
      <div className="flex gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
          {step}
        </span>
        <div>
          <h2 className="text-sm font-bold text-navy">{title}</h2>
          {hint && (
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              {hint}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
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
  });

  // Which action fired: the primary save (Enter or "Save") vs. "Publish".
  const emit = (intent: "draft" | "publish") =>
    handleSubmit((formValues) => onSubmit(toInput(formValues), intent));

  const statusText = job
    ? "Changes are live as soon as you save."
    : remaining === 0
      ? "Ready to publish. Recruiters are notified immediately."
      : `${remaining} field${remaining === 1 ? "" : "s"} left before you can publish.`;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* The form takes ~70% and the preview ~30% of the row (flex 7:3). */}
      <form
        onSubmit={emit("draft")}
        className="flex min-w-0 flex-col gap-4 lg:flex-[7]"
      >
        <div className="divide-y divide-border rounded-md border border-border bg-card shadow-card">
          <StepSection
            step={1}
            title="Basics"
            hint="What the role is and where it sits in your org."
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Job title</Label>
              <Input
                id="title"
                className={CONTROL_HEIGHT}
                placeholder="Senior Software Engineer"
                {...register("title")}
              />
              {errors.title ? (
                <p className="text-xs text-destructive">
                  {errors.title.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Recruiters search on this. Be specific about seniority.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="roleCategory">Role category</Label>
                <Controller
                  control={control}
                  name="roleCategory"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="roleCategory"
                        className={CONTROL_HEIGHT}
                      >
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
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="employmentType">Employment type</Label>
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
                {errors.employmentType && (
                  <p className="text-xs text-destructive">
                    {errors.employmentType.message}
                  </p>
                )}
              </div>
            </div>
          </StepSection>

          <StepSection
            step={2}
            title="Location"
            hint="Where the work happens, and how often on site."
          >
            <div className="flex flex-col gap-2">
              <Label>Work model</Label>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="locationState">
                  State{isRemote ? " (optional)" : ""}
                </Label>
                <Controller
                  control={control}
                  name="locationState"
                  render={({ field }) => (
                    <Select
                      value={field.value === "" ? undefined : field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="locationState"
                        className={CONTROL_HEIGHT}
                      >
                        <SelectValue placeholder="Select a state" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((state) => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.locationState && (
                  <p className="text-xs text-destructive">
                    {errors.locationState.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>
                  City{" "}
                  <span className="font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>
                {/* The same searchable, state-scoped city picker the explore
                    map uses, so the job's city matches the values recruiters
                    filter by. Disabled until a state is chosen. */}
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
              </div>
            </div>
          </StepSection>

          <StepSection
            step={3}
            title="Compensation"
            hint="The salary band for the candidate, and the fee for the recruiter."
          >
            <div className="flex flex-col gap-2">
              <Label>
                Salary range{" "}
                <span className="font-normal text-muted-foreground">
                  Optional
                </span>
              </Label>
              <div className="flex items-center gap-3">
                <MoneyInput
                  aria-label="Salary minimum"
                  placeholder="Min"
                  {...register("salaryMin")}
                />
                <span className="text-muted-foreground">–</span>
                <MoneyInput
                  aria-label="Salary maximum"
                  placeholder="Max"
                  {...register("salaryMax")}
                />
              </div>
              {(errors.salaryMin || errors.salaryMax) && (
                <p className="text-xs text-destructive">
                  {errors.salaryMin?.message ?? errors.salaryMax?.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:max-w-[16rem]">
              <Label htmlFor="salaryRatePeriod">Rate period</Label>
              <Controller
                control={control}
                name="salaryRatePeriod"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="salaryRatePeriod"
                      className={CONTROL_HEIGHT}
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

            {/* The recruiter fee is the money that drives the marketplace, so
                  it gets its own emphasized panel. */}
            <div className="rounded-lg bg-secondary/50 p-4">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="recruiterFee">Recruiter fee</Label>
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
                <p className="mt-2 text-[13px] text-muted-foreground">
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
          </StepSection>

          <StepSection
            step={4}
            title="Description"
            hint="Sell the role. Recruiters read this before deciding to work it."
          >
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <RichTextEditor
                  id="description"
                  value={field.value}
                  onChange={field.onChange}
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
          </StepSection>
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
