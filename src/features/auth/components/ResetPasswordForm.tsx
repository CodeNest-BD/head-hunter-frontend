"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { isApiError } from "@/shared/libs/errorHandler";
import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
import { PasswordInput } from "@/shared/ui-components/controls/password-input";

import { forgotPassword, resetPassword } from "../api/auth";
import { OTP_TTL_LABEL, useOtpCountdown } from "../hooks/useOtpCountdown";

// Mirrors the sign-up password rule so both screens agree on what's valid.
const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  otp: z.string().trim().length(6, "The code is six digits"),
  newPassword: z
    .string()
    .min(8, "At least 8 characters")
    .max(72, "At most 72 characters")
    .regex(/^(?=.*\p{Ll})(?=.*\p{Lu})(?=.*\d)(?=.*[^\p{L}\p{N}])/u, {
      message:
        "Include an uppercase letter, a lowercase letter, a number and a special character",
    }),
});
type FormData = z.infer<typeof schema>;

function ResetPasswordFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resending, setResending] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: searchParams.get("email") ?? "" },
  });

  // Gated per address: editing the email to one that has no outstanding code
  // must not leave the user waiting out the previous address's countdown.
  const { secondsLeft, label, markSent } = useOtpCountdown(watch("email"));

  // Send a fresh reset code without leaving the page — the same endpoint the
  // Forgot Password screen uses, so "Request another" actually re-issues a code
  // instead of bouncing back there.
  const onResend = async (): Promise<void> => {
    const email = getValues("email").trim();
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    setResending(true);
    try {
      await forgotPassword(email);
      markSent();
      toast.success("Code sent", {
        description: `We emailed a new reset code to ${email}.`,
      });
    } catch (error) {
      toast.error("Couldn't send a new code", {
        description: isApiError(error)
          ? error.message
          : "Please try again in a moment.",
      });
    } finally {
      setResending(false);
    }
  };

  const onSubmit = async (data: FormData): Promise<void> => {
    try {
      await resetPassword(data);
      toast.success("Password updated", {
        description: "Sign in with your new password.",
      });
      router.push("/login");
    } catch (error) {
      toast.error("Could not reset the password", {
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
          Set a new password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the six-digit code we emailed you and choose a new password. The
          code expires {OTP_TTL_LABEL} after it&apos;s sent.
        </p>
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
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="otp">Reset code</Label>
        <Input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          aria-invalid={errors.otp ? true : undefined}
          {...register("otp")}
          className={cn(
            "h-11 tracking-[0.3em]",
            errors.otp && "border-destructive",
          )}
          placeholder="••••••"
        />
        {errors.otp && (
          <p className="text-xs text-destructive">{errors.otp.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="newPassword">New password</Label>
        <PasswordInput
          id="newPassword"
          autoComplete="new-password"
          aria-invalid={errors.newPassword ? true : undefined}
          {...register("newPassword")}
          className={cn("h-11", errors.newPassword && "border-destructive")}
          placeholder="At least 8 characters"
        />
        {errors.newPassword && (
          <p className="text-xs text-destructive">
            {errors.newPassword.message}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} className="h-11">
        {isSubmitting ? "Updating…" : "Update password"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Didn&apos;t get a code?{" "}
        <button
          type="button"
          onClick={onResend}
          disabled={resending || secondsLeft > 0}
          className="rounded-sm font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:no-underline"
        >
          {resending
            ? "Sending…"
            : secondsLeft > 0
              ? `Request another in ${label}`
              : "Request another"}
        </button>
      </p>
    </form>
  );
}

/** useSearchParams requires a Suspense boundary in the app router. */
export function ResetPasswordForm() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordFormInner />
    </Suspense>
  );
}
