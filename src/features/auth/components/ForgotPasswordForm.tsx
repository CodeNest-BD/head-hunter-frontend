"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";

import { forgotPassword } from "../api/auth";
import { OTP_TTL_LABEL, markOtpSent } from "../hooks/useOtpCountdown";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});
type FormData = z.infer<typeof schema>;

/**
 * Step 1 of password recovery: request the emailed code. The API always
 * answers success (no account enumeration), so this always moves forward to
 * the reset screen.
 */
export function ForgotPasswordForm() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData): Promise<void> => {
    try {
      await forgotPassword(data.email);
    } catch {
      // Deliberately swallowed: the reset flow must read identically whether
      // or not the account exists, including on transient failures.
    }
    // Starts the expiry countdown the reset screen shows — recorded on the
    // same terms as the response above, so it can't leak whether a code was
    // really sent.
    markOtpSent(data.email);
    setSubmitted(true);
    toast("Check your email", {
      description:
        "If an account exists for that address, a reset code is on its way.",
    });
    router.push(`/reset-password?email=${encodeURIComponent(data.email)}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-3xl font-extrabold tracking-[-0.02em] text-foreground">
          Forgot your password?
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send a six-digit reset code. It
          expires {OTP_TTL_LABEL} after it&apos;s sent.
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
          placeholder="you@example.com"
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting || submitted}
        className="h-11"
      >
        {isSubmitting ? "Sending…" : "Send reset code"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
