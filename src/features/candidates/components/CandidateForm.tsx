"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import { NumericInput } from "@/shared/ui-components/controls/NumericInput";
import { Label } from "@/shared/ui-components/controls/label";
import { Textarea } from "@/shared/ui-components/controls/textarea";
import { majorInputToMinor, minorToMajorInput } from "@/shared/utils/money";
import {
  DOCUMENT_ACCEPT,
  DOCUMENT_CONTENT_TYPES,
  MAX_DOCUMENT_BYTES,
  MAX_DOCUMENT_MB,
} from "@/shared/libs/documentUpload";
import type { CandidateInput } from "../api/candidates";
import { useSubmitCandidate, useUpdateCandidate } from "../hooks/useCandidates";
import {
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
  /** True when the form sits in a narrow column (the inbox edit rail): the
   * numeric fields stack instead of squeezing three long-labelled columns
   * into ~360px. Viewport breakpoints can't tell that panel apart from a full
   * page, so the caller states it. */
  dense?: boolean;
}

/** null when the file is acceptable; otherwise the reason to show the user. */
function cvFileError(file: File | null): string | null {
  if (!file) return "A CV file is required";
  if (!DOCUMENT_CONTENT_TYPES.some((type) => type === file.type)) {
    return "CV must be a PDF or Word document (.pdf, .doc, .docx)";
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return `CV must be ${MAX_DOCUMENT_MB}MB or smaller`;
  }
  return null;
}

/** Empty string means "unset" for optional text fields, not a value to save. */
function toNullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** Blank means "not stated"; anything else is the number as typed — years now
 * carry a half, so this must not round. */
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

/** One outlined-field look across the whole form: white fill, a comfortable
 * (not oversized) height and soft-but-crisp corners, instead of the short
 * transparent default. */
const FIELD_CLASS = "h-10 rounded-md bg-card";
const LABEL_CLASS = "text-[13px] font-semibold text-navy";

export function CandidateForm({
  jobId,
  candidate,
  onDone,
  onCancel,
  dense = false,
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
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName" className={LABEL_CLASS}>
          Full name
        </Label>
        <Input
          id="fullName"
          className={FIELD_CLASS}
          {...register("fullName")}
        />
        {errors.fullName && (
          <p className="text-xs text-destructive">{errors.fullName.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" className={LABEL_CLASS}>
          Email
        </Label>
        <Input
          id="email"
          type="email"
          className={FIELD_CLASS}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone" className={LABEL_CLASS}>
          Phone
        </Label>
        <Input id="phone" className={FIELD_CLASS} {...register("phone")} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="overview" className={LABEL_CLASS}>
          Overview
        </Label>
        <Textarea
          id="overview"
          rows={4}
          className="min-h-[110px] rounded-md bg-card"
          {...register("overview")}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="linkedinUrl" className={LABEL_CLASS}>
          LinkedIn URL
        </Label>
        <Input
          id="linkedinUrl"
          className={FIELD_CLASS}
          {...register("linkedinUrl")}
        />
        {errors.linkedinUrl && (
          <p className="text-xs text-destructive">
            {errors.linkedinUrl.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="currentCompany" className={LABEL_CLASS}>
          Current company
        </Label>
        <Input
          id="currentCompany"
          className={FIELD_CLASS}
          {...register("currentCompany")}
        />
      </div>

      <div
        className={cn(
          "grid gap-4",
          dense ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-3",
        )}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="yearsOfExperience" className={LABEL_CLASS}>
            Years of experience
          </Label>
          <NumericInput
            decimal
            id="yearsOfExperience"
            className={FIELD_CLASS}
            {...register("yearsOfExperience")}
          />
          {errors.yearsOfExperience && (
            <p className="text-xs text-destructive">
              {errors.yearsOfExperience.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expectedSalary" className={LABEL_CLASS}>
            Expected salary (USD/yr)
          </Label>
          <NumericInput
            decimal
            id="expectedSalary"
            className={FIELD_CLASS}
            {...register("expectedSalary")}
          />
          {errors.expectedSalary && (
            <p className="text-xs text-destructive">
              {errors.expectedSalary.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="noticePeriodDays" className={LABEL_CLASS}>
            Notice period (days)
          </Label>
          <NumericInput
            id="noticePeriodDays"
            className={FIELD_CLASS}
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cvFile" className={LABEL_CLASS}>
            CV / Resume
          </Label>
          <input
            id="cvFile"
            type="file"
            accept={DOCUMENT_ACCEPT}
            onChange={(event) => {
              setCvTouched(true);
              setCvFile(event.target.files?.[0] ?? null);
            }}
            className="rounded-md border border-input bg-card px-3 py-2.5 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
          />
          {cvTouched && cvError && (
            <p className="text-xs text-destructive">{cvError}</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitDisabled}>
          {candidate
            ? updateCandidate.isPending
              ? "Saving…"
              : "Save changes"
            : submitCandidate.isPending
              ? "Submitting…"
              : "Submit candidate"}
        </Button>
      </div>
    </form>
  );
}
