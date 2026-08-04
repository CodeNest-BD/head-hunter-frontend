"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { isApiError } from "@/shared/libs/errorHandler";
import {
  signUpSchema,
  toSignUpPayload,
  MAX_SIGNUP_REFERENCES,
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

const inputClass =
  "h-10 w-full rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-900";
const labelClass = "text-sm font-medium text-zinc-900";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-500">{message}</p>;
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full max-w-md flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm"
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Create your account
        </h1>
        <p className="text-sm text-zinc-500">
          Join the HeadHunter marketplace.
        </p>
      </div>

      <Controller
        control={control}
        name="role"
        render={({ field }) => (
          <div className="flex flex-col gap-2">
            <span className={labelClass}>I am a…</span>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_OPTIONS.map((option) => {
                const active = field.value === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => field.onChange(option.value)}
                    aria-pressed={active}
                    className={`flex flex-col rounded-md border px-3 py-2 text-left transition ${
                      active
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-400"
                    }`}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                    <span
                      className={`text-xs ${active ? "text-zinc-300" : "text-zinc-500"}`}
                    >
                      {option.hint}
                    </span>
                  </button>
                );
              })}
            </div>
            <FieldError message={errors.role?.message} />
          </div>
        )}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="firstName" className={labelClass}>
            First name
          </label>
          <input
            id="firstName"
            type="text"
            autoComplete="given-name"
            {...register("firstName")}
            className={inputClass}
            placeholder="Jane"
          />
          <FieldError message={errors.firstName?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="lastName" className={labelClass}>
            Last name
          </label>
          <input
            id="lastName"
            type="text"
            autoComplete="family-name"
            {...register("lastName")}
            className={inputClass}
            placeholder="Doe"
          />
          <FieldError message={errors.lastName?.message} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="username" className={labelClass}>
          Username
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          {...register("username")}
          className={inputClass}
          placeholder="jane_doe"
        />
        <FieldError message={errors.username?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          className={inputClass}
          placeholder="you@example.com"
        />
        <FieldError message={errors.email?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
          className={inputClass}
          placeholder="At least 8 characters"
        />
        <FieldError message={errors.password?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="phone" className={labelClass}>
          Phone <span className="font-normal text-zinc-400">(optional)</span>
        </label>
        <input
          id="phone"
          type="tel"
          autoComplete="tel"
          {...register("phone")}
          className={inputClass}
          placeholder="+1-202-555-0100"
        />
        <FieldError message={errors.phone?.message} />
      </div>

      {selectedRole === "company" && (
        <div className="flex flex-col gap-2">
          <label htmlFor="companyName" className={labelClass}>
            Company name
          </label>
          <input
            id="companyName"
            type="text"
            autoComplete="organization"
            {...register("companyName")}
            className={inputClass}
            placeholder="Acme Inc."
          />
          <FieldError message={errors.companyName?.message} />
        </div>
      )}

      {selectedRole === "recruiter" && (
        <>
          <div className="flex flex-col gap-2">
            <label htmlFor="yearsExperience" className={labelClass}>
              Years of experience{" "}
              <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <input
              id="yearsExperience"
              type="text"
              inputMode="numeric"
              {...register("yearsExperience")}
              className={inputClass}
              placeholder="5"
            />
            <FieldError message={errors.yearsExperience?.message} />
          </div>

          <Controller
            control={control}
            name="specializations"
            render={({ field }) => (
              <div className="flex flex-col gap-2">
                <span className={labelClass}>
                  Specializations{" "}
                  <span className="font-normal text-zinc-400">(optional)</span>
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
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                          active
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
                        }`}
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
            <span className={labelClass}>
              References{" "}
              <span className="font-normal text-zinc-400">
                (optional, up to {MAX_SIGNUP_REFERENCES})
              </span>
            </span>
            {referenceFields.map((referenceField, index) => (
              <div
                key={referenceField.id}
                className="flex flex-col gap-2 rounded-md border border-zinc-200 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                    Reference {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeReference(index)}
                    className="text-xs font-medium text-zinc-500 underline hover:text-zinc-900"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  {...register(`references.${index}.name`)}
                  className={inputClass}
                  placeholder="Full name"
                  aria-label={`Reference ${index + 1} name`}
                />
                <FieldError
                  message={errors.references?.[index]?.name?.message}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    {...register(`references.${index}.company`)}
                    className={inputClass}
                    placeholder="Company"
                    aria-label={`Reference ${index + 1} company`}
                  />
                  <input
                    type="text"
                    {...register(`references.${index}.title`)}
                    className={inputClass}
                    placeholder="Job title"
                    aria-label={`Reference ${index + 1} title`}
                  />
                </div>
                <input
                  type="tel"
                  {...register(`references.${index}.phone`)}
                  className={inputClass}
                  placeholder="Phone"
                  aria-label={`Reference ${index + 1} phone`}
                />
              </div>
            ))}
            {referenceFields.length < MAX_SIGNUP_REFERENCES && (
              <button
                type="button"
                onClick={() => appendReference(EMPTY_REFERENCE)}
                className="h-9 rounded-md border border-dashed border-zinc-300 text-sm font-medium text-zinc-600 transition hover:border-zinc-500 hover:text-zinc-900"
              >
                + Add reference
              </button>
            )}
          </div>
        </>
      )}

      <div className="flex flex-col gap-3">
        <span className={labelClass}>
          Mailing address{" "}
          <span className="font-normal text-zinc-400">(optional)</span>
        </span>
        <input
          type="text"
          autoComplete="street-address"
          {...register("addressLine")}
          className={inputClass}
          placeholder="Street address"
          aria-label="Street address"
        />
        <FieldError message={errors.addressLine?.message} />
        <div className="grid grid-cols-[2fr_1fr_1fr] gap-2">
          <input
            type="text"
            autoComplete="address-level2"
            {...register("city")}
            className={inputClass}
            placeholder="City"
            aria-label="City"
          />
          <input
            type="text"
            autoComplete="address-level1"
            maxLength={2}
            {...register("state")}
            className={inputClass}
            placeholder="State"
            aria-label="State"
          />
          <input
            type="text"
            autoComplete="postal-code"
            {...register("zip")}
            className={inputClass}
            placeholder="ZIP"
            aria-label="ZIP code"
          />
        </div>
        <FieldError message={errors.city?.message} />
        <FieldError message={errors.state?.message} />
        <FieldError message={errors.zip?.message} />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-10 rounded-md bg-zinc-900 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60"
      >
        {isSubmitting ? "Creating account…" : "Create account"}
      </button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-zinc-200" />
        <span className="text-xs uppercase tracking-wide text-zinc-400">
          or
        </span>
        <span className="h-px flex-1 bg-zinc-200" />
      </div>

      {/* Google signup carries the chosen role + name so the backend can
          provision a brand-new google user. */}
      <GoogleAuthButton
        role={selectedRole}
        name={enteredName === "" ? undefined : enteredName}
      />

      <p className="text-center text-sm text-zinc-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-zinc-900 underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
