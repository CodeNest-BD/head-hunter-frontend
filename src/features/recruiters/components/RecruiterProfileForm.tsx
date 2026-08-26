"use client";

import type { ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";

import { cn } from "@/shared/libs/shadCnConfig";
import { useSpecializationsField } from "@/shared/hooks/useSpecializationsField";
import { useStateCities } from "@/shared/hooks/useStateCities";
import { Button } from "@/shared/ui-components/controls/button";
import { CityCombobox } from "@/shared/ui-components/controls/CityCombobox";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
import { StateSelect } from "@/shared/ui-components/controls/StateSelect";
import { useUpdateMyRecruiterProfile } from "../hooks/useRecruiterProfile";
import {
  MAX_EXPERIENCES,
  recruiterProfileFormSchema,
  type RecruiterProfile,
  type RecruiterProfileFormValues,
} from "../schemas";

/** A labelled form section: title + description on the left, fields on the right. */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-x-8 gap-y-4 p-5 sm:p-6 md:grid-cols-[minmax(0,15rem)_1fr]">
      <div>
        <h3 className="text-sm font-bold text-navy">{title}</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

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
      <div className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => {
          const checked = value.includes(chip.value);
          return (
            <button
              key={chip.value}
              type="button"
              aria-pressed={checked}
              onClick={() => toggle(chip.value)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                checked
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-input hover:text-navy",
              )}
            >
              {chip.label}
            </button>
          );
        })}
        {!isAdding && (
          <button
            type="button"
            onClick={openAdd}
            className="rounded-full border border-dashed border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-input hover:text-navy"
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
        <p className="text-xs text-destructive">{error ?? formError}</p>
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
        // null clears; undefined would be dropped by axios and keep the old value.
        addressLine: values.addressLine === "" ? null : values.addressLine,
        city: values.city === "" ? null : values.city,
        state: values.state === "" ? null : values.state.toUpperCase(),
        zip: values.zip === "" ? null : values.zip,
        linkedinUrl: values.linkedinUrl === "" ? null : values.linkedinUrl,
        phone: values.phone === "" ? null : values.phone,
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
      <div className="divide-y divide-border rounded-md border border-border bg-card shadow-card">
        <Section
          title="Location"
          description="Where you're based. Used to surface nearby roles."
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="addressLine">Address</Label>
            <Input id="addressLine" {...register("addressLine")} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
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
                <p className="text-xs text-destructive">
                  {errors.state.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
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
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="zip">ZIP</Label>
              <Input id="zip" {...register("zip")} />
            </div>
          </div>
        </Section>

        <Section
          title="Staffing experience"
          description="The firms you have recruited for. Your total years and the sectors shown on your profile are added up from these."
        >
          {firms.fields.length === 0 && (
            <p className="text-[13px] text-muted-foreground">
              No firms listed yet. Add one so companies can see your track
              record.
            </p>
          )}

          {firms.fields.map((field, index) => (
            <div
              key={field.id}
              className="flex flex-col gap-4 rounded-md border border-border p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="text-sm font-semibold text-navy">
                  Firm {index + 1}
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

              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`experiences.${index}.firmName`}>
                    Firm name
                  </Label>
                  <Input
                    id={`experiences.${index}.firmName`}
                    placeholder="Robert Half"
                    {...register(`experiences.${index}.firmName`)}
                  />
                  {errors.experiences?.[index]?.firmName && (
                    <p className="text-xs text-destructive">
                      {errors.experiences[index]?.firmName?.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`experiences.${index}.years`}>Years</Label>
                  <Input
                    id={`experiences.${index}.years`}
                    inputMode="numeric"
                    placeholder="5"
                    {...register(`experiences.${index}.years`)}
                  />
                  {errors.experiences?.[index]?.years && (
                    <p className="text-xs text-destructive">
                      {errors.experiences[index]?.years?.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Specializations</Label>
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
                + Add another firm
              </Button>
            </div>
          )}
          {firms.fields.length >= MAX_EXPERIENCES && (
            <p className="text-[13px] text-muted-foreground">
              You can list up to {MAX_EXPERIENCES} firms.
            </p>
          )}
        </Section>

        <Section
          title="Contact"
          description="Your phone is never shown to companies — they reach you through the platform."
        >
          <div className="flex flex-col gap-2 sm:max-w-sm">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              inputMode="tel"
              placeholder="+1-202-555-0100"
              {...register("phone")}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:max-w-sm">
            <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
            <Input
              id="linkedinUrl"
              placeholder="https://www.linkedin.com/in/dana-whitfield"
              {...register("linkedinUrl")}
            />
            {errors.linkedinUrl && (
              <p className="text-xs text-destructive">
                {errors.linkedinUrl.message}
              </p>
            )}
          </div>
        </Section>
      </div>

      {/* Save bar sticks to the viewport bottom while the form is in view, so
          Save is always reachable and never looks disabled at a card's edge. */}
      <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-md border border-border bg-card/95 px-4 py-3 shadow-card-lg backdrop-blur sm:px-5">
        <span className="text-sm text-muted-foreground">
          {isDirty ? "Unsaved changes" : "All changes saved"}
        </span>
        <div className="flex gap-2">
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
