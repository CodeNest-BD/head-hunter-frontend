"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
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
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="addressLine">Address</Label>
        <Input id="addressLine" {...register("addressLine")} />
      </div>

      <div className="grid grid-cols-3 gap-4">
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
            <p className="text-sm text-destructive">{errors.state.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="zip">ZIP</Label>
          <Input id="zip" {...register("zip")} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="yearsExperience">Years of recruiting experience</Label>
        <Input
          id="yearsExperience"
          inputMode="numeric"
          className="max-w-[8rem]"
          {...register("yearsExperience")}
        />
        {errors.yearsExperience && (
          <p className="text-sm text-destructive">
            {errors.yearsExperience.message}
          </p>
        )}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Specializations</legend>
        <Controller
          control={control}
          name="specializations"
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-2">
              {SPECIALIZATIONS.map((item) => {
                const checked = field.value.includes(item);
                return (
                  <label key={item} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={checked}
                      onChange={() =>
                        field.onChange(
                          checked
                            ? field.value.filter(
                                (v: Specialization) => v !== item,
                              )
                            : [...field.value, item],
                        )
                      }
                    />
                    {SPECIALIZATION_LABELS[item]}
                  </label>
                );
              })}
            </div>
          )}
        />
      </fieldset>

      <div>
        <Button type="submit" disabled={update.isPending || !isDirty}>
          {update.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
