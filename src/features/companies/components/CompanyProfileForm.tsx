"use client";

import type { ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { cn } from "@/shared/libs/shadCnConfig";
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

/** A form section: title + hint on the left, fields on the right. */
function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-x-8 gap-y-4 p-5 sm:p-6 md:grid-cols-[minmax(0,15rem)_1fr]">
      <div>
        <h3 className="text-sm font-bold text-navy">{title}</h3>
        {hint && (
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

interface CompanyProfileFormProps {
  profile: CompanyProfile;
}

export function CompanyProfileForm({ profile }: CompanyProfileFormProps) {
  const update = useUpdateMyCompanyProfile();

  const {
    register,
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
      phone: profile.phone ?? "",
    },
  });

  const descriptionLength = watch("description").trim().length;
  const descriptionShort = descriptionLength < MIN_DESCRIPTION;

  const onSubmit = handleSubmit((values) => {
    update.mutate(
      {
        companyName: values.companyName,
        // The API rejects "" as a URL; null is how a field is cleared.
        website: values.website === "" ? null : values.website,
        description: values.description === "" ? null : values.description,
        commissionRangeMinMinor: majorInputToMinor(values.commissionMin),
        commissionRangeMaxMinor: majorInputToMinor(values.commissionMax),
        // "" is how the form spells "cleared"; the API wants null, since an
        // empty string would fail the validators that guard these columns.
        ...blankToNull({
          addressLine: values.addressLine,
          city: values.city,
          state: values.state === "" ? "" : values.state.toUpperCase(),
          zip: values.zip,
          industry: values.industry,
          employeeSize: values.employeeSize,
          revenue: values.revenue,
          phone: values.phone,
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
        <Section
          title="Identity"
          hint="What recruiters see when they browse companies."
        >
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
              description and a published range are what earn a follow.
            </p>
          </div>
        </Section>

        <Section
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
        </Section>

        <Section
          title="Contact"
          hint="Your phone stays private until it is verified."
        >
          <div className="flex flex-col gap-2 sm:max-w-sm">
            <div className="flex items-center justify-between">
              <Label htmlFor="phone">Phone</Label>
              {profile.phone !== null && (
                <span
                  className={cn(
                    "text-xs font-medium",
                    profile.phoneVerified
                      ? "text-emerald-600"
                      : "text-[#B4820A]",
                  )}
                >
                  {profile.phoneVerified ? "Verified" : "Not verified"}
                </span>
              )}
            </div>
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
        </Section>

        <Section
          title="Mailing address"
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
          <div className="grid grid-cols-[minmax(0,1fr)_6rem_8rem] gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="San Francisco"
                {...register("city")}
              />
              {errors.city && (
                <p className="text-xs text-destructive">
                  {errors.city.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" placeholder="CA" {...register("state")} />
              {errors.state && (
                <p className="text-xs text-destructive">
                  {errors.state.message}
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
        </Section>

        <Section
          title="Recruiter commission range"
          hint="Shown on your public profile. The binding fee is still set per job."
        >
          <div className="grid grid-cols-2 gap-4 sm:max-w-md">
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
        </Section>
      </div>

      {/* Sticky save bar so Save is always reachable while editing. */}
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
