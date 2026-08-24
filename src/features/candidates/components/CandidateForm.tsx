"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
import { Textarea } from "@/shared/ui-components/controls/textarea";
import { majorInputToMinor, minorToMajorInput } from "@/shared/utils/money";
import type { CandidateInput } from "../api/candidates";
import { useSubmitCandidate, useUpdateCandidate } from "../hooks/useCandidates";
import {
  CV_ACCEPT,
  CV_CONTENT_TYPES,
  MAX_CV_BYTES,
  candidateFormSchema,
  type Candidate,
  type CandidateFormValues,
} from "../schemas";

interface CandidateFormProps {
  jobId: string;
  candidate?: Candidate;
  onDone: () => void;
  /** Renders a Cancel beside the submit when provided, so the two actions share
   * a row instead of the caller stacking its own button underneath. */
  onCancel?: () => void;
}

/** null when the file is acceptable; otherwise the reason to show the user. */
function cvFileError(file: File | null): string | null {
  if (!file) return "A CV file is required";
  if (!CV_CONTENT_TYPES.some((type) => type === file.type)) {
    return "CV must be a PDF or Word document (.pdf, .doc, .docx)";
  }
  if (file.size > MAX_CV_BYTES) {
    return `CV must be ${Math.floor(MAX_CV_BYTES / (1024 * 1024))}MB or smaller`;
  }
  return null;
}

/** Empty string means "unset" for optional text fields, not a value to save. */
function toNullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function toNullableInt(value: string): number | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : Number(trimmed);
}

function defaultValuesFor(candidate?: Candidate): CandidateFormValues {
  if (!candidate) {
    return {
      fullName: "",
      email: "",
      phone: "",
      overview: "",
      linkedinUrl: "",
      yearsOfExperience: "",
      currentCompany: "",
      expectedSalary: "",
      noticePeriodDays: "",
    };
  }
  return {
    fullName: candidate.fullName,
    email: candidate.email,
    phone: candidate.phone ?? "",
    overview: candidate.overview ?? "",
    linkedinUrl: candidate.linkedinUrl ?? "",
    yearsOfExperience:
      candidate.yearsOfExperience === null
        ? ""
        : String(candidate.yearsOfExperience),
    currentCompany: candidate.currentCompany ?? "",
    expectedSalary: minorToMajorInput(candidate.expectedSalaryMinor),
    noticePeriodDays:
      candidate.noticePeriodDays === null
        ? ""
        : String(candidate.noticePeriodDays),
  };
}

export function CandidateForm({
  jobId,
  candidate,
  onDone,
  onCancel,
}: CandidateFormProps) {
  const submitCandidate = useSubmitCandidate(jobId);
  const updateCandidate = useUpdateCandidate(jobId);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvTouched, setCvTouched] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateFormSchema),
    defaultValues: defaultValuesFor(candidate),
  });

  // Only meaningful in create mode; edit mode never shows the CV input.
  const cvError = candidate ? null : cvFileError(cvFile);

  const onSubmit = handleSubmit((values) => {
    if (candidate) {
      // Only dirty fields go over the wire — omitted means "unchanged" to the
      // API, so an untouched field must never be sent at all. null clears one.
      const input: Partial<CandidateInput> = {};
      if (dirtyFields.fullName) input.fullName = values.fullName.trim();
      if (dirtyFields.email) input.email = values.email.trim();
      if (dirtyFields.phone) input.phone = toNullableText(values.phone);
      if (dirtyFields.overview)
        input.overview = toNullableText(values.overview);
      if (dirtyFields.linkedinUrl)
        input.linkedinUrl = toNullableText(values.linkedinUrl);
      if (dirtyFields.yearsOfExperience)
        input.yearsOfExperience = toNullableInt(values.yearsOfExperience);
      if (dirtyFields.currentCompany)
        input.currentCompany = toNullableText(values.currentCompany);
      if (dirtyFields.expectedSalary)
        input.expectedSalaryMinor = majorInputToMinor(values.expectedSalary);
      if (dirtyFields.noticePeriodDays)
        input.noticePeriodDays = toNullableInt(values.noticePeriodDays);

      updateCandidate.mutate(
        { id: candidate.id, input },
        { onSuccess: onDone },
      );
      return;
    }

    if (!cvFile || cvError) {
      setCvTouched(true);
      return;
    }

    const input: CandidateInput = {
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: toNullableText(values.phone),
      overview: toNullableText(values.overview),
      linkedinUrl: toNullableText(values.linkedinUrl),
      yearsOfExperience: toNullableInt(values.yearsOfExperience),
      currentCompany: toNullableText(values.currentCompany),
      expectedSalaryMinor: majorInputToMinor(values.expectedSalary),
      noticePeriodDays: toNullableInt(values.noticePeriodDays),
    };

    submitCandidate.mutate({ input, cvFile }, { onSuccess: onDone });
  });

  const submitDisabled = candidate
    ? updateCandidate.isPending || !isDirty
    : submitCandidate.isPending || Boolean(cvError);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" {...register("fullName")} />
        {errors.fullName && (
          <p className="text-xs text-destructive">{errors.fullName.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" {...register("phone")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="overview">Overview</Label>
        <Textarea id="overview" rows={4} {...register("overview")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
        <Input id="linkedinUrl" {...register("linkedinUrl")} />
        {errors.linkedinUrl && (
          <p className="text-xs text-destructive">
            {errors.linkedinUrl.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="currentCompany">Current company</Label>
        <Input id="currentCompany" {...register("currentCompany")} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="yearsOfExperience">Years of experience</Label>
          <Input
            id="yearsOfExperience"
            inputMode="numeric"
            {...register("yearsOfExperience")}
          />
          {errors.yearsOfExperience && (
            <p className="text-xs text-destructive">
              {errors.yearsOfExperience.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="expectedSalary">Expected salary (USD/yr)</Label>
          <Input
            id="expectedSalary"
            inputMode="decimal"
            {...register("expectedSalary")}
          />
          {errors.expectedSalary && (
            <p className="text-xs text-destructive">
              {errors.expectedSalary.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="noticePeriodDays">Notice period (days)</Label>
          <Input
            id="noticePeriodDays"
            inputMode="numeric"
            {...register("noticePeriodDays")}
          />
          {errors.noticePeriodDays && (
            <p className="text-xs text-destructive">
              {errors.noticePeriodDays.message}
            </p>
          )}
        </div>
      </div>

      {!candidate && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="cvFile">CV / Resume</Label>
          <input
            id="cvFile"
            type="file"
            accept={CV_ACCEPT}
            onChange={(event) => {
              setCvTouched(true);
              setCvFile(event.target.files?.[0] ?? null);
            }}
            className="text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
          />
          {cvTouched && cvError && (
            <p className="text-xs text-destructive">{cvError}</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={submitDisabled}>
          {candidate
            ? updateCandidate.isPending
              ? "Saving…"
              : "Save changes"
            : submitCandidate.isPending
              ? "Submitting…"
              : "Submit candidate"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
