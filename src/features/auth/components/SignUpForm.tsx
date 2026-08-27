"use client";

import { useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useForm,
  useFieldArray,
  useWatch,
  Controller,
  type Control,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { isApiError } from "@/shared/libs/errorHandler";
import { cn } from "@/shared/libs/shadCnConfig";
import { useSpecializationsField } from "@/shared/hooks/useSpecializationsField";
import { useStateCities } from "@/shared/hooks/useStateCities";
import { Button } from "@/shared/ui-components/controls/button";
import { CityCombobox } from "@/shared/ui-components/controls/CityCombobox";
import { Input } from "@/shared/ui-components/controls/input";
import { PasswordInput } from "@/shared/ui-components/controls/password-input";
import { Label } from "@/shared/ui-components/controls/label";
import { StateSelect } from "@/shared/ui-components/controls/StateSelect";
import {
  signUpSchema,
  toSignUpPayload,
  MAX_SIGNUP_EXPERIENCES,
  MAX_SIGNUP_REFERENCES,
  PASSWORD_REQUIREMENTS,
  type SignUpFormData,
} from "../schemas";
import { signUp } from "../api/auth";
import { GoogleAuthButton } from "./GoogleAuthButton";
import type { Role } from "../types";

const ROLE_OPTIONS: ReadonlyArray<{
  value: Role;
  label: string;
  hint: string;
}> = [
  { value: "company", label: "Company", hint: "Hire talent" },
  { value: "recruiter", label: "Recruiter", hint: "Find placements" },
];

const optionalHint = (
  <span className="font-normal text-muted-foreground">(optional)</span>
);

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

interface PasswordChecklistProps {
  control: Control<SignUpFormData>;
  id: string;
}

/** Reads `password` via `useWatch` rather than the form's own `watch`, so a
 * keystroke re-renders only this checklist instead of the whole form. */
function PasswordChecklist({ control, id }: PasswordChecklistProps) {
  const password = useWatch({ control, name: "password" });
  return (
    <ul id={id} className="flex flex-col gap-1">
      {PASSWORD_REQUIREMENTS.map((requirement) => {
        const met = requirement.test(password);
        return (
          <li
            key={requirement.key}
            className={cn(
              "flex items-center gap-1.5 text-xs",
              met ? "text-primary" : "text-muted-foreground",
            )}
          >
            {met ? (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>
              {requirement.label}
              <span className="sr-only">
                {met ? " — met" : " — not met yet"}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
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
      <span className="text-sm font-medium leading-none text-foreground">
        Specializations {optionalHint}
      </span>
      <div className="flex flex-wrap gap-2">
        {chips.map((specialization) => {
          const active = value.includes(specialization.value);
          return (
            <button
              key={specialization.value}
              type="button"
              onClick={() => toggle(specialization.value)}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                active
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              {specialization.label}
            </button>
          );
        })}
        {!isAdding && (
          <button
            type="button"
            onClick={openAdd}
            className="rounded-full border border-dashed border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            + Add
          </button>
        )}
      </div>
      {isAdding && (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            type="text"
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
            className="h-9"
          />
          <Button type="button" size="sm" variant="outline" onClick={commitAdd}>
            Add
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={cancelAdd}>
            Cancel
          </Button>
        </div>
      )}
      <FieldError message={error ?? formError} />
    </div>
  );
}

const EMPTY_REFERENCE = { name: "", company: "", title: "", phone: "" };

const DEFAULT_VALUES: SignUpFormData = {
  role: "company",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  companyName: "",
  linkedinUrl: "",
  experiences: [],
  references: [],
  addressLine: "",
  city: "",
  state: "",
  zip: "",
};

export function SignUpForm() {
  const router = useRouter();
  const passwordRequirementsId = useId();
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const {
    fields: referenceFields,
    append: appendReference,
    remove: removeReference,
  } = useFieldArray({ control, name: "references" });

  const firms = useFieldArray({ control, name: "experiences" });

  const selectedRole = watch("role");
  // City options are scoped to the chosen state, matching every other address.
  const stateValue = watch("state");
  const cityOptions = useStateCities(stateValue || undefined);
  // Google provisioning wants a display name; compose it from what's typed.
  const enteredName = [watch("firstName"), watch("lastName")]
    .filter(Boolean)
    .join(" ")
    .trim();

  const onSubmit = async (data: SignUpFormData): Promise<void> => {
    try {
      await signUp(toSignUpPayload(data));
      toast.success("Account created", {
        description: "Enter the code we emailed you to verify your account.",
      });
      router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      toast.error("Sign up failed", {
        description: isApiError(error)
          ? error.message
          : "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-3xl font-extrabold tracking-[-0.02em] text-foreground">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Join the Head-Hunters marketplace.
        </p>
      </div>

      <Controller
        control={control}
        name="role"
        render={({ field }) => (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium leading-none text-foreground">
              I am a…
            </legend>
            {/* Two short cards; side by side even on a phone, where stacking
                them pushes the whole form down a screen for no gain. */}
            <div className="grid grid-cols-2 gap-3">
              {ROLE_OPTIONS.map((option) => {
                const active = field.value === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => field.onChange(option.value)}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col rounded-md border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent",
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        active && "text-primary",
                      )}
                    >
                      {option.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {option.hint}
                    </span>
                  </button>
                );
              })}
            </div>
            <FieldError message={errors.role?.message} />
          </fieldset>
        )}
      />

      {/* First/last are short enough to share a row at 360px. */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            type="text"
            autoComplete="given-name"
            aria-invalid={errors.firstName ? true : undefined}
            {...register("firstName")}
            className={cn("h-11", errors.firstName && "border-destructive")}
            placeholder="Jane"
          />
          <FieldError message={errors.firstName?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            type="text"
            autoComplete="family-name"
            aria-invalid={errors.lastName ? true : undefined}
            {...register("lastName")}
            className={cn("h-11", errors.lastName && "border-destructive")}
            placeholder="Doe"
          />
          <FieldError message={errors.lastName?.message} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
          {...register("email")}
          className={cn("h-11", errors.email && "border-destructive")}
          placeholder="you@example.com"
        />
        <FieldError message={errors.email?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={passwordRequirementsId}
          {...register("password")}
          className={cn("h-11", errors.password && "border-destructive")}
          placeholder="At least 8 characters"
        />
        <PasswordChecklist id={passwordRequirementsId} control={control} />
        <FieldError message={errors.password?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">Re-type password</Label>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          aria-invalid={errors.confirmPassword ? true : undefined}
          {...register("confirmPassword")}
          className={cn("h-11", errors.confirmPassword && "border-destructive")}
          placeholder="Repeat your password"
        />
        <FieldError message={errors.confirmPassword?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Phone {optionalHint}</Label>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          aria-invalid={errors.phone ? true : undefined}
          {...register("phone")}
          className={cn("h-11", errors.phone && "border-destructive")}
          placeholder="+1-202-555-0100"
        />
        <FieldError message={errors.phone?.message} />
      </div>

      {selectedRole === "company" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="companyName">Company name</Label>
          <Input
            id="companyName"
            type="text"
            autoComplete="organization"
            aria-invalid={errors.companyName ? true : undefined}
            {...register("companyName")}
            className={cn("h-11", errors.companyName && "border-destructive")}
            placeholder="Acme Inc."
          />
          <FieldError message={errors.companyName?.message} />
        </div>
      )}

      {selectedRole === "recruiter" && (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="linkedinUrl">LinkedIn URL {optionalHint}</Label>
            <Input
              id="linkedinUrl"
              type="text"
              aria-invalid={errors.linkedinUrl ? true : undefined}
              {...register("linkedinUrl")}
              className={cn("h-11", errors.linkedinUrl && "border-destructive")}
              placeholder="https://www.linkedin.com/in/dana-whitfield"
            />
            <FieldError message={errors.linkedinUrl?.message} />
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium leading-none text-foreground">
              Staffing experience{" "}
              <span className="font-normal text-muted-foreground">
                (optional, up to {MAX_SIGNUP_EXPERIENCES} firms)
              </span>
            </span>

            {firms.fields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-col gap-3 rounded-md border border-border p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="text-sm font-semibold text-foreground">
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

                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`experiences.${index}.firmName`}>
                      Firm name
                    </Label>
                    <Input
                      id={`experiences.${index}.firmName`}
                      {...register(`experiences.${index}.firmName`)}
                      className="h-11"
                      placeholder="Robert Half"
                    />
                    <FieldError
                      message={errors.experiences?.[index]?.firmName?.message}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`experiences.${index}.years`}>Years</Label>
                    <Input
                      id={`experiences.${index}.years`}
                      inputMode="numeric"
                      {...register(`experiences.${index}.years`)}
                      className="h-11"
                      placeholder="5"
                    />
                    <FieldError
                      message={errors.experiences?.[index]?.years?.message}
                    />
                  </div>
                </div>

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
            ))}

            {firms.fields.length < MAX_SIGNUP_EXPERIENCES && (
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
                  + Add a firm
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium leading-none text-foreground">
              References{" "}
              <span className="font-normal text-muted-foreground">
                (optional, up to {MAX_SIGNUP_REFERENCES})
              </span>
            </span>
            {referenceFields.map((referenceField, index) => (
              <div
                key={referenceField.id}
                className="flex flex-col gap-2.5 rounded-md border border-border/70 bg-card/50 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Reference {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeReference(index)}
                    className="inline-flex items-center gap-1 rounded-sm text-xs font-medium text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    Remove
                  </button>
                </div>
                <Input
                  type="text"
                  {...register(`references.${index}.name`)}
                  className="h-11"
                  placeholder="Full name"
                  aria-label={`Reference ${index + 1} name`}
                />
                <FieldError
                  message={errors.references?.[index]?.name?.message}
                />
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <Input
                    type="text"
                    {...register(`references.${index}.company`)}
                    className="h-11"
                    placeholder="Company"
                    aria-label={`Reference ${index + 1} company`}
                  />
                  <Input
                    type="text"
                    {...register(`references.${index}.title`)}
                    className="h-11"
                    placeholder="Job title"
                    aria-label={`Reference ${index + 1} title`}
                  />
                </div>
                <Input
                  type="tel"
                  {...register(`references.${index}.phone`)}
                  className="h-11"
                  placeholder="Phone"
                  aria-label={`Reference ${index + 1} phone`}
                />
              </div>
            ))}
            {referenceFields.length < MAX_SIGNUP_REFERENCES && (
              <Button
                type="button"
                variant="outline"
                onClick={() => appendReference(EMPTY_REFERENCE)}
                className="h-11 border-dashed"
              >
                + Add reference
              </Button>
            )}
          </div>
        </>
      )}

      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium leading-none text-foreground">
          Mailing address {optionalHint}
        </span>
        <Input
          type="text"
          autoComplete="street-address"
          {...register("addressLine")}
          className="h-11"
          placeholder="Street address"
          aria-label="Street address"
        />
        <FieldError message={errors.addressLine?.message} />
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_1.4fr_0.9fr]">
          <Controller
            control={control}
            name="state"
            render={({ field }) => (
              <StateSelect
                className="h-11"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={control}
            name="city"
            render={({ field }) => (
              <CityCombobox
                cities={cityOptions}
                value={field.value === "" ? null : field.value}
                onChange={(city) => field.onChange(city ?? "")}
                disabled={stateValue === ""}
                className="h-11"
              />
            )}
          />
          <Input
            type="text"
            autoComplete="postal-code"
            {...register("zip")}
            className="h-11"
            placeholder="ZIP"
            aria-label="ZIP code"
          />
        </div>
        <FieldError message={errors.city?.message} />
        <FieldError message={errors.state?.message} />
        <FieldError message={errors.zip?.message} />
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} className="h-11">
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>

      {/* Google signup carries the chosen role + name so the backend can
          provision a brand-new google user. */}
      <GoogleAuthButton
        role={selectedRole}
        name={enteredName === "" ? undefined : enteredName}
      />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="rounded-sm font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
