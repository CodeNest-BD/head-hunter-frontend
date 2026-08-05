"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
import { Textarea } from "@/shared/ui-components/controls/textarea";
import { majorInputToMinor, minorToMajorInput } from "@/shared/utils/money";
import {
  companyProfileFormSchema,
  type CompanyProfile,
  type CompanyProfileFormValues,
} from "../schemas";
import { useUpdateMyCompanyProfile } from "../hooks/useCompanyProfile";

interface CompanyProfileFormProps {
  profile: CompanyProfile;
}

export function CompanyProfileForm({ profile }: CompanyProfileFormProps) {
  const update = useUpdateMyCompanyProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileFormSchema),
    defaultValues: {
      companyName: profile.companyName,
      website: profile.website ?? "",
      description: profile.description ?? "",
      commissionMin: minorToMajorInput(profile.commissionRangeMinMinor),
      commissionMax: minorToMajorInput(profile.commissionRangeMaxMinor),
    },
  });

  const onSubmit = handleSubmit((values) => {
    update.mutate(
      {
        companyName: values.companyName,
        // The API rejects "" as a URL; null is how a field is cleared.
        website: values.website === "" ? null : values.website,
        description: values.description === "" ? null : values.description,
        commissionRangeMinMinor: majorInputToMinor(values.commissionMin),
        commissionRangeMaxMinor: majorInputToMinor(values.commissionMax),
      },
      // Re-baseline the form so the Save button disables again until the next
      // real edit, instead of staying enabled after a successful save.
      { onSuccess: () => reset(values) },
    );
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="companyName">Company name</Label>
        <Input id="companyName" {...register("companyName")} />
        {errors.companyName && (
          <p className="text-xs text-destructive">
            {errors.companyName.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          placeholder="https://acme.com"
          {...register("website")}
        />
        {errors.website && (
          <p className="text-xs text-destructive">{errors.website.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={4}
          placeholder="What your company does, and what makes it a good place to work."
          {...register("description")}
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-foreground">
          Recruiter commission range
        </legend>
        <p className="mb-2 text-sm text-muted-foreground">
          Shown on your public profile. The binding fee is set per job.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="commissionMin">Minimum ($)</Label>
            <Input
              id="commissionMin"
              inputMode="decimal"
              placeholder="3000"
              {...register("commissionMin")}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="commissionMax">Maximum ($)</Label>
            <Input
              id="commissionMax"
              inputMode="decimal"
              placeholder="20000"
              {...register("commissionMax")}
            />
            {errors.commissionMax && (
              <p className="text-xs text-destructive">
                {errors.commissionMax.message}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      <div>
        {/* Disabled while in flight so a double-click cannot submit twice. */}
        <Button type="submit" disabled={update.isPending || !isDirty}>
          {update.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
