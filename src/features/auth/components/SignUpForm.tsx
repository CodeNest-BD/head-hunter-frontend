"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { isApiError } from "@/shared/libs/errorHandler";
import { signUpSchema, type SignUpFormData } from "../schemas";
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
    defaultValues: { role: "company" },
  });

  const selectedRole = watch("role");
  const enteredName = watch("name");

  const onSubmit = async (data: SignUpFormData): Promise<void> => {
    try {
      await signUp(data);
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
      className="flex w-full max-w-sm flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm"
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
            <span className="text-sm font-medium text-zinc-900">I am a…</span>
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
            {errors.role && (
              <p className="text-xs text-red-500">{errors.role.message}</p>
            )}
          </div>
        )}
      />

      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-medium text-zinc-900">
          Name
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          {...register("name")}
          className="h-10 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-900"
          placeholder="Jane Doe"
        />
        {errors.name && (
          <p className="text-xs text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium text-zinc-900">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          className="h-10 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-900"
          placeholder="you@example.com"
        />
        {errors.email && (
          <p className="text-xs text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium text-zinc-900">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
          className="h-10 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-900"
          placeholder="At least 8 characters"
        />
        {errors.password && (
          <p className="text-xs text-red-500">{errors.password.message}</p>
        )}
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
      <GoogleAuthButton role={selectedRole} name={enteredName} />

      <p className="text-center text-sm text-zinc-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-zinc-900 underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
