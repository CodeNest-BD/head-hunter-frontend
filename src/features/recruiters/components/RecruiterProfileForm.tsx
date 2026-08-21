"use client";

import type { ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
import { useUpdateMyRecruiterProfile } from "../hooks/useRecruiterProfile";
import {
  SPECIALIZATIONS,
  SPECIALIZATION_LABELS,
  recruiterProfileFormSchema,
  type RecruiterProfile,
  type RecruiterProfileFormValues,
  type Specialization,
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

interface RecruiterProfileFormProps {
  profile: RecruiterProfile;
}

export function RecruiterProfileForm({ profile }: RecruiterProfileFormProps) {
  const update = useUpdateMyRecruiterProfile();

  const {
    register,
    control,
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
      yearsExperience:
        profile.yearsExperience === null ? "" : String(profile.yearsExperience),
      specializations: profile.specializations ?? [],
    },
  });

  const onSubmit = handleSubmit((values) => {
    update.mutate(
      {
        // null clears; undefined would be dropped by axios and keep the old value.
        addressLine: values.addressLine === "" ? null : values.addressLine,
        city: values.city === "" ? null : values.city,
        state: values.state === "" ? null : values.state.toUpperCase(),
        zip: values.zip === "" ? null : values.zip,
        yearsExperience:
          values.yearsExperience === "" ? null : Number(values.yearsExperience),
        specializations:
          values.specializations.length === 0 ? null : values.specializations,
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register("city")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                maxLength={2}
                placeholder="TX"
                {...register("state")}
              />
              {errors.state && (
                <p className="text-xs text-destructive">
                  {errors.state.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="zip">ZIP</Label>
              <Input id="zip" {...register("zip")} />
            </div>
          </div>
        </Section>

        <Section
          title="Experience"
          description="Full years in a recruiting role."
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="yearsExperience">Years</Label>
            <Input
              id="yearsExperience"
              inputMode="numeric"
              className="max-w-[10rem]"
              {...register("yearsExperience")}
            />
            {errors.yearsExperience && (
              <p className="text-xs text-destructive">
                {errors.yearsExperience.message}
              </p>
            )}
          </div>
        </Section>

        <Section
          title="Specializations"
          description="Pick the sectors you place candidates in."
        >
          <Controller
            control={control}
            name="specializations"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {SPECIALIZATIONS.map((item) => {
                  const checked = field.value.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={checked}
                      onClick={() =>
                        field.onChange(
                          checked
                            ? field.value.filter(
                                (v: Specialization) => v !== item,
                              )
                            : [...field.value, item],
                        )
                      }
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                        checked
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-input hover:text-navy",
                      )}
                    >
                      {SPECIALIZATION_LABELS[item]}
                    </button>
                  );
                })}
              </div>
            )}
          />
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
