"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";

import { cn } from "@/shared/libs/shadCnConfig";
import { useSpecializationsField } from "@/shared/hooks/useSpecializationsField";
import { useStateCities } from "@/shared/hooks/useStateCities";
import { Tag } from "@/shared/ui-components/badges/Tag";
import { Button } from "@/shared/ui-components/controls/button";
import { Card } from "@/shared/ui-components/controls/card";
import { CityCombobox } from "@/shared/ui-components/controls/CityCombobox";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
import { NumericInput } from "@/shared/ui-components/controls/NumericInput";
import { PhoneInput } from "@/shared/ui-components/controls/PhoneInput";
import { StateSelect } from "@/shared/ui-components/controls/StateSelect";
import { FormSection } from "@/shared/ui-components/layout/FormSection";
import { useUpdateMyRecruiterProfile } from "../hooks/useRecruiterProfile";
import { RecruiterPhotoUploader } from "./RecruiterPhotoUploader";
import {
  MAX_EXPERIENCES,
  recruiterProfileFormSchema,
  type RecruiterProfile,
  type RecruiterProfileFormValues,
} from "../schemas";

interface SpecializationsChipsProps {
  value: string[];
  onChange: (next: string[]) => void;
  formError?: string;
}

/** Its own component (not inlined in the Controller's render prop) so
 * `useSpecializationsField` is called from a proper component, not a plain
 * callback. */
function SpecializationsChips({
  value,
  onChange,
  formError,
}: SpecializationsChipsProps) {
  const {
    chips,
    isAdding,
    draft,
    setDraft,
    error,
    toggle,
    openAdd,
    cancelAdd,
    commitAdd,
  } = useSpecializationsField({ value, onChange });

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {chips.map((chip) => (
          <Tag
            key={chip.value}
            selected={value.includes(chip.value)}
            onClick={() => toggle(chip.value)}
          >
            {chip.label}
          </Tag>
        ))}
        {!isAdding && (
          // The reference's `.tag--add`, written out rather than taken from
          // `Tag`: a clickable `Tag` is a toggle and announces `aria-pressed`,
          // which this "open the draft field" affordance is not.
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex h-6.5 items-center gap-[5px] rounded-full border border-dashed border-line-strong bg-surface px-2.5 text-meta font-[550] text-ink-muted transition-colors hover:border-blue hover:text-blue-ink"
          >
            + Add
          </button>
        )}
      </div>
      {isAdding && (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitAdd();
              }
              if (event.key === "Escape") cancelAdd();
            }}
            placeholder="Add a specialization"
            aria-label="Custom specialization"
            className="h-9 max-w-[16rem]"
          />
          <Button type="button" size="sm" variant="outline" onClick={commitAdd}>
            Add
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={cancelAdd}>
            Cancel
          </Button>
        </div>
      )}
      {(error ?? formError) && (
        <p className="text-meta font-medium text-bad">{error ?? formError}</p>
      )}
    </div>
  );
}

interface RecruiterProfileFormProps {
  profile: RecruiterProfile;
}

export function RecruiterProfileForm({ profile }: RecruiterProfileFormProps) {
  const update = useUpdateMyRecruiterProfile();

  const {
    register,
    control,
    watch,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<RecruiterProfileFormValues>({
    resolver: zodResolver(recruiterProfileFormSchema),
    defaultValues: {
      addressLine: profile.addressLine ?? "",
      city: profile.city ?? "",
      state: profile.state ?? "",
      zip: profile.zip ?? "",
      linkedinUrl: profile.linkedinUrl ?? "",
      // E.164, as the international phone input produces and the API stores.
      phone: profile.phone ?? "",
      experiences: profile.experiences.map((experience) => ({
        firmName: experience.firmName,
        years: String(experience.years),
        specializations: experience.specializations,
      })),
    },
  });

  const firms = useFieldArray({ control, name: "experiences" });

  // City options are scoped to the chosen state, matching the job form.
  const stateValue = watch("state");
  const cityOptions = useStateCities(stateValue || undefined);

  const onSubmit = handleSubmit((values) => {
    update.mutate(
      {
        // Address and phone are required since sign-up, so they are always sent
        // and never nulled — the API refuses a null on them. For the rest, null
        // clears; undefined would be dropped by axios and keep the old value.
        addressLine: values.addressLine,
        city: values.city,
        state: values.state.toUpperCase(),
        zip: values.zip,
        linkedinUrl: values.linkedinUrl === "" ? null : values.linkedinUrl,
        phone: values.phone,
        // Sent whole: the API replaces the list rather than merging it, which
        // is what makes removing a firm here actually remove it.
        experiences: values.experiences.map((firm) => ({
          firmName: firm.firmName,
          years: Number(firm.years),
          specializations: firm.specializations,
        })),
      },
      { onSuccess: () => reset(values) },
    );
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Card>
        <FormSection
          title="Photo"
          hint="Shown on your profile and in the top-right menu."
        >
          <RecruiterPhotoUploader profile={profile} />
        </FormSection>
        <FormSection title="Location" hint="Where you're based.">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="addressLine">Address</Label>
            <Input id="addressLine" {...register("addressLine")} />
            {errors.addressLine && (
              <p className="text-meta font-medium text-bad">
                {errors.addressLine.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="state">State</Label>
              <Controller
                control={control}
                name="state"
                render={({ field }) => (
                  <StateSelect
                    id="state"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.state && (
                <p className="text-meta font-medium text-bad">
                  {errors.state.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">City</Label>
              <Controller
                control={control}
                name="city"
                render={({ field }) => (
                  <CityCombobox
                    cities={cityOptions}
                    value={field.value === "" ? null : field.value}
                    onChange={(city) => field.onChange(city ?? "")}
                    disabled={stateValue === ""}
                  />
                )}
              />
              {errors.city && (
                <p className="text-meta font-medium text-bad">
                  {errors.city.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="zip">ZIP</Label>
              <NumericInput
                id="zip"
                className="tabular-nums"
                placeholder="94103"
                {...register("zip")}
              />
              {errors.zip && (
                <p className="text-meta font-medium text-bad">
                  {errors.zip.message}
                </p>
              )}
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Recruiting Experience"
          hint="The organizations you have recruited for. Your total years at each and your specialties!"
        >
          {firms.fields.length === 0 && (
            <p className="text-meta text-ink-faint">
              No companies listed yet. Add one so companies can see your track
              record.
            </p>
          )}

          {firms.fields.map((field, index) => (
            <div
              key={field.id}
              className="flex flex-col gap-2.5 rounded-sm border border-line bg-surface-sub p-3.5"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="text-sub font-[650] text-ink">
                  Company {index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => firms.remove(index)}
                >
                  Remove
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`experiences.${index}.firmName`}>
                    Company Name
                  </Label>
                  <Input
                    id={`experiences.${index}.firmName`}
                    placeholder="Robert Half"
                    {...register(`experiences.${index}.firmName`)}
                  />
                  {errors.experiences?.[index]?.firmName && (
                    <p className="text-meta font-medium text-bad">
                      {errors.experiences[index]?.firmName?.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`experiences.${index}.years`}>Years</Label>
                  <NumericInput
                    id={`experiences.${index}.years`}
                    className="tabular-nums"
                    placeholder="5"
                    {...register(`experiences.${index}.years`)}
                  />
                  {errors.experiences?.[index]?.years && (
                    <p className="text-meta font-medium text-bad">
                      {errors.experiences[index]?.years?.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>
                  Specializations{" "}
                  <span className="font-[450] text-ink-faint">
                    (At Least 1)
                  </span>
                </Label>
                <Controller
                  control={control}
                  name={`experiences.${index}.specializations`}
                  render={({ field: chips }) => (
                    <SpecializationsChips
                      value={chips.value}
                      onChange={chips.onChange}
                      formError={
                        errors.experiences?.[index]?.specializations?.message
                      }
                    />
                  )}
                />
              </div>
            </div>
          ))}

          {firms.fields.length < MAX_EXPERIENCES && (
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  firms.append({
                    firmName: "",
                    years: "",
                    specializations: [],
                  })
                }
              >
                + Add another company
              </Button>
            </div>
          )}
          {firms.fields.length >= MAX_EXPERIENCES && (
            <p className="text-meta text-ink-faint">
              You can list up to {MAX_EXPERIENCES} companies.
            </p>
          )}
        </FormSection>

        <FormSection
          title="Contact"
          hint="Your phone is never shown to companies — they reach you through the platform."
        >
          <div className="flex flex-col gap-1.5 sm:max-w-sm">
            <Label htmlFor="phone">Phone</Label>
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <PhoneInput
                  id="phone"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={errors.phone !== undefined}
                />
              )}
            />
            {errors.phone && (
              <p className="text-meta font-medium text-bad">
                {errors.phone.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5 sm:max-w-sm">
            <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
            <Input
              id="linkedinUrl"
              placeholder="https://www.linkedin.com/in/dana-whitfield"
              {...register("linkedinUrl")}
            />
            {errors.linkedinUrl && (
              <p className="text-meta font-medium text-bad">
                {errors.linkedinUrl.message}
              </p>
            )}
          </div>
        </FormSection>
      </Card>

      {/* The reference's `.savebar`: it sticks to the viewport bottom while the
          form is in view, so Save is always reachable and never looks disabled
          at a card's edge. */}
      <div className="sticky bottom-3 z-20 flex items-center gap-2.5 rounded-md border border-line bg-surface/90 px-3.5 py-2.5 shadow-pop backdrop-blur-[6px]">
        <span className="flex items-center gap-[7px] text-[12.5px] text-ink-muted">
          <span
            aria-hidden="true"
            className={cn(
              "size-2 shrink-0 rounded-full",
              isDirty ? "bg-pending" : "bg-ok",
            )}
          />
          {isDirty ? "Unsaved changes" : "All changes saved"}
        </span>
        <div className="ml-auto flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!isDirty || update.isPending}
            onClick={() => reset()}
          >
            Discard
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={update.isPending || !isDirty}
          >
            {update.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}
