"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
import { PhoneInput } from "@/shared/ui-components/controls/PhoneInput";
import {
  companyEmployeeInfoFormSchema,
  type CompanyEmployeeInfoFormValues,
  type CompanyProfile,
} from "../schemas";
import { useUpdateMyCompanyProfile } from "../hooks/useCompanyProfile";
import { CompanyFormSaveBar, CompanyFormSection } from "./CompanyFormLayout";

interface CompanyEmployeeInfoFormProps {
  profile: CompanyProfile;
}

export function CompanyEmployeeInfoForm({
  profile,
}: CompanyEmployeeInfoFormProps) {
  const update = useUpdateMyCompanyProfile();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<CompanyEmployeeInfoFormValues>({
    resolver: zodResolver(companyEmployeeInfoFormSchema),
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      // E.164, as the international phone input produces and the API stores.
      phone: profile.phone ?? "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    update.mutate(
      {
        // Required on the User row, so they are sent as-is — the schema has
        // already refused an empty one.
        firstName: values.firstName,
        lastName: values.lastName,
        // Required since sign-up, so it can be changed but never cleared. Already
        // E.164 from the international phone input.
        phone: values.phone,
      },
      // Re-baseline the form so the Save button disables again until the next
      // real edit, instead of staying enabled after a successful save.
      { onSuccess: () => reset(values) },
    );
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="rounded-md border border-border bg-card shadow-card">
        <CompanyFormSection
          title="Contact"
          hint="Head-Hunters.com user at your organization."
        >
          <div className="grid gap-4 sm:max-w-lg sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" {...register("firstName")} />
              {errors.firstName && (
                <p className="text-xs text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" {...register("lastName")} />
              {errors.lastName && (
                <p className="text-xs text-destructive">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:max-w-sm">
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
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>
        </CompanyFormSection>
      </div>

      <CompanyFormSaveBar
        isDirty={isDirty}
        isSaving={update.isPending}
        onDiscard={() => reset()}
      />
    </form>
  );
}
