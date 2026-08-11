"use client";

import { useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { isApiError } from "@/shared/libs/errorHandler";
import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
import {
  signUpSchema,
  toSignUpPayload,
  MAX_SIGNUP_REFERENCES,
  PASSWORD_REQUIREMENTS,
  RECRUITER_SPECIALIZATIONS,
  RECRUITER_SPECIALIZATION_LABELS,
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
  { value: "company", label: "Company", hint: "Hire recruiters" },
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
  password: string;
  id: string;
}

function PasswordChecklist({ password, id }: PasswordChecklistProps) {
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

const EMPTY_REFERENCE = { name: "", company: "", title: "", phone: "" };

const DEFAULT_VALUES: SignUpFormData = {
  role: "company",
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  password: "",
  phone: "",
  companyName: "",
  yearsExperience: "",
  specializations: [],
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

  const selectedRole = watch("role");
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
                      "flex flex-col rounded-lg border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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

      <div className="grid grid-cols-2 gap-4">
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
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          autoComplete="username"
          aria-invalid={errors.username ? true : undefined}
          {...register("username")}
          className={cn("h-11", errors.username && "border-destructive")}
          placeholder="jane_doe"
        />
        <FieldError message={errors.username?.message} />
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
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={passwordRequirementsId}
          {...register("password")}
          className={cn("h-11", errors.password && "border-destructive")}
          placeholder="At least 8 characters"
        />
        <PasswordChecklist
          id={passwordRequirementsId}
          password={watch("password")}
        />
        <FieldError message={errors.password?.message} />
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
            <Label htmlFor="yearsExperience">
              Years of experience {optionalHint}
            </Label>
            <Input
              id="yearsExperience"
              type="text"
              inputMode="numeric"
              aria-invalid={errors.yearsExperience ? true : undefined}
              {...register("yearsExperience")}
              className={cn(
                "h-11",
                errors.yearsExperience && "border-destructive",
              )}
              placeholder="5"
            />
            <FieldError message={errors.yearsExperience?.message} />
          </div>

          <Controller
            control={control}
            name="specializations"
            render={({ field }) => (
              <div className="flex flex-col gap-2.5">
                <span className="text-sm font-medium leading-none text-foreground">
                  Specializations {optionalHint}
                </span>
                <div className="flex flex-wrap gap-2">
                  {RECRUITER_SPECIALIZATIONS.map((specialization) => {
                    const active = field.value.includes(specialization);
                    return (
                      <button
                        key={specialization}
                        type="button"
                        onClick={() =>
                          field.onChange(
                            active
                              ? field.value.filter((s) => s !== specialization)
                              : [...field.value, specialization],
                          )
                        }
                        aria-pressed={active}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          active
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
                        )}
                      >
                        {RECRUITER_SPECIALIZATION_LABELS[specialization]}
                      </button>
                    );
                  })}
                </div>
                <FieldError message={errors.specializations?.message} />
              </div>
            )}
          />

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
                className="flex flex-col gap-2.5 rounded-lg border border-border/70 bg-card/50 p-4"
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
                <div className="grid grid-cols-2 gap-2.5">
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
        <div className="grid grid-cols-[2fr_1fr_1fr] gap-2.5">
          <Input
            type="text"
            autoComplete="address-level2"
            {...register("city")}
            className="h-11"
            placeholder="City"
            aria-label="City"
          />
          <Input
            type="text"
            autoComplete="address-level1"
            maxLength={2}
            {...register("state")}
            className="h-11 uppercase"
            placeholder="State"
            aria-label="State"
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

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          or continue with
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

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
