"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { useStateCities } from "@/shared/hooks/useStateCities";
import { cn } from "@/shared/libs/shadCnConfig";
import { CityCombobox } from "@/shared/ui-components/controls/CityCombobox";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
import { StateSelect } from "@/shared/ui-components/controls/StateSelect";
import { Textarea } from "@/shared/ui-components/controls/textarea";
import { majorInputToMinor, minorToMajorInput } from "@/shared/utils/money";
import {
  companyProfileFormSchema,
  type CompanyProfile,
  type CompanyProfileFormValues,
} from "../schemas";
import { useUpdateMyCompanyProfile } from "../hooks/useCompanyProfile";
import { CompanyFormSaveBar, CompanyFormSection } from "./CompanyFormLayout";
import { CompanyLogoUploader } from "./CompanyLogoUploader";

const MAX_DESCRIPTION = 400;
/** Below this a description reads as a placeholder to recruiters. */
const MIN_DESCRIPTION = 40;

/** Maps every "" in a patch to null, which is how the API clears a field. */
const blankToNull = <T extends Record<string, string>>(
  fields: T,
): { [K in keyof T]: string | null } =>
  Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      value === "" ? null : value,
    ]),
  ) as { [K in keyof T]: string | null };

interface CompanyProfileFormProps {
  profile: CompanyProfile;
}

export function CompanyProfileForm({ profile }: CompanyProfileFormProps) {
  const update = useUpdateMyCompanyProfile();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileFormSchema),
    defaultValues: {
      companyName: profile.companyName,
      website: profile.website ?? "",
      description: profile.description ?? "",
      commissionMin: minorToMajorInput(profile.commissionRangeMinMinor),
      commissionMax: minorToMajorInput(profile.commissionRangeMaxMinor),
      addressLine: profile.addressLine ?? "",
      city: profile.city ?? "",
      state: profile.state ?? "",
      zip: profile.zip ?? "",
      industry: profile.industry ?? "",
      yearFounded:
        profile.yearFounded === null ? "" : String(profile.yearFounded),
      employeeSize: profile.employeeSize ?? "",
      revenue: profile.revenue ?? "",
    },
  });

  const descriptionLength = watch("description").trim().length;
  const descriptionShort = descriptionLength < MIN_DESCRIPTION;

  // City options are scoped to the chosen state, mirroring the job form.
  const stateValue = watch("state");
  const cityOptions = useStateCities(stateValue || undefined);

  const onSubmit = handleSubmit((values) => {
    update.mutate(
      {
        companyName: values.companyName,
        // The API rejects "" as a URL; null is how a field is cleared.
        website: values.website === "" ? null : values.website,
        description: values.description === "" ? null : values.description,
        commissionRangeMinMinor: majorInputToMinor(values.commissionMin),
        commissionRangeMaxMinor: majorInputToMinor(values.commissionMax),
        // Required since sign-up, so these four are always sent and never
        // nulled — the API refuses a null on them.
        addressLine: values.addressLine,
        city: values.city,
        state: values.state.toUpperCase(),
        zip: values.zip,
        // "" is how the form spells "cleared"; the API wants null, since an
        // empty string would fail the validators that guard these columns.
        ...blankToNull({
          industry: values.industry,
          employeeSize: values.employeeSize,
          revenue: values.revenue,
        }),
        yearFounded:
          values.yearFounded === "" ? null : Number(values.yearFounded),
      },
      // Re-baseline the form so the Save button disables again until the next
      // real edit, instead of staying enabled after a successful save.
      { onSuccess: () => reset(values) },
    );
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="divide-y divide-border rounded-md border border-border bg-card shadow-card">
        <CompanyFormSection
          title="Identity"
          hint="What recruiters see when they browse companies."
        >
          <div className="flex flex-col gap-2">
            <Label>Logo</Label>
            <CompanyLogoUploader profile={profile} />
          </div>
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
              <p className="text-xs text-destructive">
                {errors.website.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description</Label>
              <span
                className={cn(
                  "text-xs",
                  descriptionShort ? "text-[#B4820A]" : "text-muted-foreground",
                )}
              >
                {descriptionLength} / {MAX_DESCRIPTION}
                {descriptionShort ? " · too short to build trust" : ""}
              </span>
            </div>
            <Textarea
              id="description"
              rows={5}
              maxLength={MAX_DESCRIPTION}
              placeholder="What your company does, and what makes it a good place to work."
              {...register("description")}
            />
            <p className="text-[13px] text-muted-foreground">
              This is the whole first impression in the companies grid — a real
              description and a published range are what draw recruiters in.
            </p>
          </div>
        </CompanyFormSection>

        <CompanyFormSection
          title="Business details"
          hint="Shown on your profile so recruiters can size up the company."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="SaaS"
                {...register("industry")}
              />
              {errors.industry && (
                <p className="text-xs text-destructive">
                  {errors.industry.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="yearFounded">Year founded</Label>
              <Input
                id="yearFounded"
                inputMode="numeric"
                placeholder="2014"
                {...register("yearFounded")}
              />
              {errors.yearFounded && (
                <p className="text-xs text-destructive">
                  {errors.yearFounded.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="employeeSize">Number of employees</Label>
              <Input
                id="employeeSize"
                placeholder="51-200"
                {...register("employeeSize")}
              />
              {errors.employeeSize && (
                <p className="text-xs text-destructive">
                  {errors.employeeSize.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="revenue">Annual revenue</Label>
              <Input id="revenue" placeholder="$50M" {...register("revenue")} />
              {errors.revenue && (
                <p className="text-xs text-destructive">
                  {errors.revenue.message}
                </p>
              )}
            </div>
          </div>
        </CompanyFormSection>

        <CompanyFormSection
          title="Address"
          hint="Not shown publicly — used for contracts and billing."
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="addressLine">Street address</Label>
            <Input
              id="addressLine"
              placeholder="123 Market St"
              {...register("addressLine")}
            />
            {errors.addressLine && (
              <p className="text-xs text-destructive">
                {errors.addressLine.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,11rem)_6rem]">
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
              {errors.city && (
                <p className="text-xs text-destructive">
                  {errors.city.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="zip">ZIP</Label>
              <Input id="zip" placeholder="94103" {...register("zip")} />
              {errors.zip && (
                <p className="text-xs text-destructive">{errors.zip.message}</p>
              )}
            </div>
          </div>
        </CompanyFormSection>

        <CompanyFormSection
          title="Recruiter commission range"
          hint="Shown on your public profile. The binding fee is still set per job."
        >
          <div className="grid grid-cols-1 gap-4 sm:max-w-md sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="commissionMin">Minimum ($)</Label>
              <Input
                id="commissionMin"
                inputMode="decimal"
                placeholder="3000"
                {...register("commissionMin")}
              />
              {errors.commissionMin && (
                <p className="text-xs text-destructive">
                  {errors.commissionMin.message}
                </p>
              )}
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
