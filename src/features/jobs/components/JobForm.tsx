"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui-components/controls/select";
import { Textarea } from "@/shared/ui-components/controls/textarea";
import { US_STATES } from "@/shared/data/usStatesGeo";
import {
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
const NO_STATE_VALUE = "any";

interface JobFormProps {
  job?: Job;
  onSubmit: (input: JobWriteInput) => void;
  isSubmitting: boolean;
  submitLabel: string;
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

export function JobForm({
  job,
  onSubmit,
  isSubmitting,
  submitLabel,
}: JobFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: toDefaults(job),
  });

  const submit = handleSubmit((values) => {
    onSubmit({
      title: values.title,
      description: values.description === "" ? undefined : values.description,
      roleCategory: values.roleCategory,
      employmentType:
        values.employmentType === "" ? undefined : values.employmentType,
      locationState:
        values.locationState === ""
          ? undefined
          : values.locationState.toUpperCase(),
      locationCity:
        values.locationCity === "" ? undefined : values.locationCity,
      isRemote: values.isRemote,
      salaryMinMinor: majorInputToMinor(values.salaryMin),
      salaryMaxMinor: majorInputToMinor(values.salaryMax),
      // Required by the schema, so a plain conversion is safe here.
      recruiterFeeMinor: majorToMinor(Number(values.recruiterFee)),
    });
  });

  return (
    <form onSubmit={submit} className="flex max-w-2xl flex-col gap-5">
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={5} {...register("description")} />
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
                  <SelectValue placeholder="Not specified" />
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
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="locationState">State</Label>
          <Controller
            control={control}
            name="locationState"
            render={({ field }) => (
              <Select
                value={field.value === "" ? NO_STATE_VALUE : field.value}
                onValueChange={(value) =>
                  field.onChange(value === NO_STATE_VALUE ? "" : value)
                }
              >
                <SelectTrigger id="locationState">
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_STATE_VALUE}>Any state</SelectItem>
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
          <Label htmlFor="locationCity">City</Label>
          <Input
            id="locationCity"
            placeholder="San Francisco"
            {...register("locationCity")}
          />
        </div>
      </div>

      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register("isRemote")}
        />
        Remote
      </label>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="salaryMin">Salary minimum ($)</Label>
          <Input
            id="salaryMin"
            inputMode="decimal"
            {...register("salaryMin")}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="salaryMax">Salary maximum ($)</Label>
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="recruiterFee">Recruiter fee ($)</Label>
        <p className="text-sm text-muted-foreground">
          What you will pay a recruiter for a successful hire.
        </p>
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

      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
