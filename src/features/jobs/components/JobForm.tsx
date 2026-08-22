"use client";

import type { ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
import { RichTextEditor } from "@/shared/ui-components/controls/RichTextEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui-components/controls/select";
import { useMinRecruiterFee } from "@/features/billing";
import { US_CITIES } from "@/shared/data/usCities";
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
  jobFormSchema,
  type Job,
  type JobFormValues,
} from "../schemas";
import type { JobWriteInput } from "../api/jobs";

// Radix Select items can't take an empty-string value, so the "clear the
// state" option needs a sentinel that this form translates to/from "" —
// the value `locationState` actually holds, since it's optional.

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
    recruiterFee: minorToMajorInput(job?.recruiterFeeMinor),
  };
}

/** A form section: title + hint on the left, fields on the right. */
function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-x-8 gap-y-4 p-5 sm:p-6 md:grid-cols-[minmax(0,15rem)_1fr]">
      <div>
        <h2 className="text-sm font-bold text-navy">{title}</h2>
        {hint && (
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

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

  const isRemote = watch("isRemote");
  const locationState = watch("locationState");
  const citiesInState = US_CITIES.filter(
    (city) => city.state === locationState,
  );

  const toInput = (values: JobFormValues): JobWriteInput => ({
    title: values.title,
    // Sanitized at save as well as render — the editor is not a boundary.
    description:
      values.description === ""
        ? undefined
        : sanitizeRichText(values.description),
    roleCategory: values.roleCategory,
    employmentType:
      values.employmentType === "" ? undefined : values.employmentType,
    locationState:
      values.locationState === ""
        ? undefined
        : values.locationState.toUpperCase(),
    locationCity: values.locationCity === "" ? undefined : values.locationCity,
    isRemote: values.isRemote,
    salaryMinMinor: majorInputToMinor(values.salaryMin),
    salaryMaxMinor: majorInputToMinor(values.salaryMax),
    // Required by the schema, so a plain conversion is safe here.
    recruiterFeeMinor: majorToMinor(Number(values.recruiterFee)),
  });

  // Which action fired: the primary save (Enter or "Save") vs. "Publish".
  const emit = (intent: "draft" | "publish") =>
    handleSubmit((values) => onSubmit(toInput(values), intent));

  return (
    <form onSubmit={emit("draft")} className="flex flex-col gap-4">
      <div className="divide-y divide-border rounded-md border border-border bg-card shadow-card">
        <Section title="Basics" hint="What the role is and where it sits.">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Job title</Label>
            <Input
              id="title"
              placeholder="Senior Software Engineer"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
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
                    <SelectTrigger id="roleCategory">
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
                    <SelectTrigger id="employmentType">
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
        </Section>

        <Section title="Location" hint="Where the work happens.">
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
                    <SelectTrigger id="locationState">
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
              <Label htmlFor="locationCity">City (optional)</Label>
              {/* Suggestions, not a closed list: US_CITIES is a curated set of
                  the largest cities plus state capitals, so a select would
                  reject plenty of real places. A datalist narrows to the chosen
                  state while still accepting anything typed. */}
              <Input
                id="locationCity"
                list="location-city-options"
                autoComplete="off"
                placeholder={
                  locationState ? "Start typing a city" : "Pick a state first"
                }
                {...register("locationCity")}
              />
              <datalist id="location-city-options">
                {citiesInState.map((city) => (
                  <option key={city.name} value={city.name} />
                ))}
              </datalist>
            </div>
          </div>

          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-navy">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register("isRemote")}
            />
            Remote
          </label>
        </Section>

        <Section
          title="Compensation"
          hint="The salary band for the candidate and the fee for the recruiter."
        >
          {/* The salary band and the recruiter fee are different money paid by
              different parties to different people, so they get their own rows
              rather than reading as three columns of one figure. */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="salaryMin">Salary minimum ($) (optional)</Label>
              <Input
                id="salaryMin"
                inputMode="decimal"
                {...register("salaryMin")}
              />
              {errors.salaryMin && (
                <p className="text-xs text-destructive">
                  {errors.salaryMin.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="salaryMax">Salary maximum ($) (optional)</Label>
              <Input
                id="salaryMax"
                inputMode="decimal"
                {...register("salaryMax")}
              />
              {errors.salaryMax && (
                <p className="text-xs text-destructive">
                  {errors.salaryMax.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex max-w-xs flex-col gap-2">
            <Label htmlFor="recruiterFee">Recruiter fee ($)</Label>
            <Input
              id="recruiterFee"
              inputMode="decimal"
              placeholder="10000"
              {...register("recruiterFee")}
            />
            {errors.recruiterFee && (
              <p className="text-xs text-destructive">
                {errors.recruiterFee.message}
              </p>
            )}
          </div>
          <p className="text-[13px] text-muted-foreground">
            What you will pay a recruiter for a successful hire.
            {minFee && (
              <>
                {" "}
                Publishing requires at least{" "}
                <span className="font-semibold text-navy">
                  {formatMinor(minFee.amountMinor)}
                </span>
                .
              </>
            )}
          </p>
        </Section>

        <Section
          title="Description"
          hint="Sell the role — recruiters read this before deciding to work it."
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
          {errors.description && (
            <p className="text-xs text-destructive">
              {errors.description.message}
            </p>
          )}
        </Section>
      </div>

      {/* Sticky action bar so Save is always reachable in a long form. */}
      <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-md border border-border bg-card/95 px-4 py-3 shadow-card-lg backdrop-blur sm:px-5">
        <span className="text-sm text-muted-foreground">
          {job
            ? "Changes are live as soon as you save."
            : "Save as a draft, or publish it live right away."}
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
  );
}
