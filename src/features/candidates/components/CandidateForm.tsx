"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  FileText,
  Paperclip,
  Target,
  User,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import {
  isPlainText,
  isRichTextEmpty,
  sanitizeRichText,
} from "@/shared/libs/richText";
import { Tile, type TileTone } from "@/shared/ui-components/list/Tile";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import { MoneyInput } from "@/shared/ui-components/controls/MoneyInput";
import { NumericInput } from "@/shared/ui-components/controls/NumericInput";
import { Label } from "@/shared/ui-components/controls/label";
import { RichTextEditor } from "@/shared/ui-components/controls/RichTextEditor";
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

/**
 * The overview, sanitized the way every stored rich-text value is, or null
 * when the editor holds no actual text — an untouched editor emits "<p></p>",
 * which `trim()` alone would save as a non-empty overview that renders blank.
 */
function toNullableOverview(value: string): string | null {
  if (isRichTextEmpty(value)) return null;
  return sanitizeRichText(value);
}

/**
 * A stored overview as the editor needs it.
 *
 * Overviews written before the rich-text editor are plain text carrying real
 * newlines. Tiptap parses whatever it is given as HTML, where a newline is
 * just whitespace — so seeding it with the raw value collapses every line
 * break, and the first save then persists the flattened text. Blank lines
 * become paragraphs and single newlines become breaks, which is what the
 * reader already sees via `RichTextView`'s pre-wrapped plain-text branch.
 */
function overviewToEditorValue(stored: string | null): string {
  if (stored === null || stored === "") return "";
  if (!isPlainText(stored)) return stored;
  return stored
    .split(/\n{2,}/)
    .map(
      (paragraph) =>
        `<p>${paragraph
          // `isPlainText` guarantees no "<", so "&" is the only character
          // that would otherwise be read as the start of an entity.
          .replace(/&/g, "&amp;")
          .replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
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
    overview: overviewToEditorValue(candidate.overview),
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
    control,
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
      if (dirtyFields.overview)
        input.overview = toNullableOverview(values.overview);
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
      overview: toNullableOverview(values.overview),
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
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" {...register("fullName")} />
          {errors.fullName && (
            <p className="text-meta font-medium text-bad">
              {errors.fullName.message}
            </p>
          )}
        </div>

        {/* No phone or email field. Direct contact details are what let a
            company go round the recruiter who sourced the candidate, so the
            client asked for both off this form; everything needed to arrange
            an interview passes through the thread instead. The company never
            saw them anyway (see `CandidateDetailPanel`), so the platform now
            simply does not ask. Submissions made before this keep whatever
            they were given, and the recruiter still sees those. */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
          <Input id="linkedinUrl" {...register("linkedinUrl")} />
          {errors.linkedinUrl && (
            <p className="text-meta font-medium text-bad">
              {errors.linkedinUrl.message}
            </p>
          )}
        </div>
      </FormSection>

      <FormSection icon={FileText} iconTone="warn" title="Profile">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="overview">Overview</Label>
          {/* The same editor the job description uses: a recruiter writing a
              background wanted bold, bullets and underline, and `RichTextView`
              already renders the result wherever a candidate is read — an
              overview saved before this still renders as plain text. */}
          <Controller
            control={control}
            name="overview"
            render={({ field }) => (
              <RichTextEditor
                id="overview"
                value={field.value}
                onChange={field.onChange}
                placeholder="Background, strengths, why they fit this role…"
              />
            )}
          />
        </div>

        <div className={twoCol}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currentCompany">Current Company</Label>
            <Input id="currentCompany" {...register("currentCompany")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="yearsOfExperience">Years of Experience</Label>
            <NumericInput
              decimal
              id="yearsOfExperience"
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
            <Label htmlFor="expectedSalary">Expected Salary (USD/yr)</Label>
            {/* `MoneyInput`, not a bare number field: a salary typed as
                "30000" read back as a quantity rather than an amount. The form
                still holds the bare digits — the $ and commas are display. */}
            <Controller
              control={control}
              name="expectedSalary"
              render={({ field }) => (
                <MoneyInput
                  ref={field.ref}
                  // Whole dollars: a salary is quoted to the dollar, and the
                  // schema already refuses anything with a fraction.
                  decimal={false}
                  id="expectedSalary"
                  placeholder="30,000"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
            {errors.expectedSalary && (
              <p className="text-meta font-medium text-bad">
                {errors.expectedSalary.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="noticePeriodDays">Notice Period (days)</Label>
            <NumericInput
              id="noticePeriodDays"
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
