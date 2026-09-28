"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  FileText,
  Paperclip,
  Target,
  User,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { Tile, type TileTone } from "@/shared/ui-components/list/Tile";
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
const FIELD_CLASS = "";
const LABEL_CLASS = "";

/** A titled sub-card grouping related fields — the editable mirror of the
 * candidate rail's Contact / Profile / Expectations sections. */
function FormSection({
  icon,
  iconTone,
  title,
  children,
}: {
  icon: LucideIcon;
  iconTone: TileTone;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface shadow-e1">
      {/* `.card__head` */}
      <div className="flex items-center gap-2.5 border-b border-line bg-surface-sub px-3.5 py-2.5">
        <Tile icon={icon} tone={iconTone} className="size-6 rounded-xs" />
        <span className="text-sub font-[650] text-ink">{title}</span>
      </div>
      <div className="flex flex-col gap-3 p-3.5">{children}</div>
    </div>
  );
}

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

  const twoCol = cn("grid gap-3", dense ? "grid-cols-1" : "grid-cols-2");

  return (
    <form onSubmit={onSubmit} className="space-y-3.5">
      <FormSection icon={User} iconTone="blue" title="Contact">
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
            <p className="text-meta font-medium text-bad">
              {errors.fullName.message}
            </p>
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
            <p className="text-meta font-medium text-bad">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className={twoCol}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone" className={LABEL_CLASS}>
              Phone
            </Label>
            <Input id="phone" className={FIELD_CLASS} {...register("phone")} />
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
              <p className="text-meta font-medium text-bad">
                {errors.linkedinUrl.message}
              </p>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection icon={FileText} iconTone="warn" title="Profile">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="overview" className={LABEL_CLASS}>
            Overview
          </Label>
          <Textarea
            id="overview"
            rows={4}
            className="min-h-[104px]"
            {...register("overview")}
          />
        </div>

        <div className={twoCol}>
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
              <p className="text-meta font-medium text-bad">
                {errors.yearsOfExperience.message}
              </p>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection icon={Target} iconTone="ok" title="Expectations">
        <div className={twoCol}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="expectedSalary" className={LABEL_CLASS}>
              Expected salary (USD/yr)
            </Label>
            <NumericInput
              id="expectedSalary"
              className={FIELD_CLASS}
              {...register("expectedSalary")}
            />
            {errors.expectedSalary && (
              <p className="text-meta font-medium text-bad">
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
              <p className="text-meta font-medium text-bad">
                {errors.noticePeriodDays.message}
              </p>
            )}
          </div>
        </div>
      </FormSection>

      {!candidate && (
        <FormSection icon={Paperclip} iconTone="violet" title="CV / Resume">
          <input
            id="cvFile"
            type="file"
            aria-label="CV / Resume"
            accept={DOCUMENT_ACCEPT}
            onChange={(event) => {
              setCvTouched(true);
              setCvFile(event.target.files?.[0] ?? null);
            }}
            className="rounded-sm border border-line-strong bg-surface px-3 py-2.5 text-body text-ink file:mr-3 file:rounded-xs file:border-0 file:bg-blue file:px-3 file:py-1.5 file:text-sub file:font-semibold file:text-white hover:file:bg-blue-deep"
          />
          {cvTouched && cvError && (
            <p className="mt-1.5 text-meta font-medium text-bad">{cvError}</p>
          )}
        </FormSection>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
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
