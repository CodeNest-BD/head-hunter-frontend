"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
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
    formState: { errors, isDirty },
  } = useForm<CompanyEmployeeInfoFormValues>({
    resolver: zodResolver(companyEmployeeInfoFormSchema),
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
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
        // "" is how the form spells "cleared"; the API wants null, since an
        // empty string would fail the validator guarding this column.
        phone: values.phone === "" ? null : values.phone,
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
          hint="Who we and our recruiters deal with. Your phone stays private until it is verified."
        >
          <div className="grid gap-4 sm:max-w-lg sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" {...register("firstName")} />
              {errors.firstName && (
                <p className="text-xs text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lastName">Last name</Label>
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
            <Input
              id="phone"
              inputMode="tel"
              placeholder="+1-202-555-0100"
              {...register("phone")}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
            <p className="text-[13px] text-muted-foreground">
              Recruiters only see this once it is verified. Changing the number
              clears that, so it has to be verified again.
            </p>
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
