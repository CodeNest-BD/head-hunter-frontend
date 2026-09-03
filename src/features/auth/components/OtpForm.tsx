"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { isApiError } from "@/shared/libs/errorHandler";
import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { NumericInput } from "@/shared/ui-components/controls/NumericInput";
import { Label } from "@/shared/ui-components/controls/label";
import { otpSchema, type OtpFormData } from "../schemas";
import { verifyOtp, resendOtp } from "../api/auth";
import { useAuth } from "../hooks/useAuth";

interface OtpFormProps {
  email: string;
  /** Send a fresh code as soon as the screen opens (e.g. arriving from a
   * blocked sign-in, where the original code is likely stale). */
  autoResend?: boolean;
}

export function OtpForm({ email, autoResend = false }: OtpFormProps) {
  const { establishSession } = useAuth();
  const [resending, setResending] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OtpFormData>({ resolver: zodResolver(otpSchema) });

  const onSubmit = async (data: OtpFormData): Promise<void> => {
    try {
      const { accessToken } = await verifyOtp({ email, otp: data.otp });
      await establishSession(accessToken);
    } catch (error) {
      toast.error("Verification failed", {
        description: isApiError(error)
          ? error.message
          : "That code didn't work. Please try again.",
      });
    }
  };

  const onResend = useCallback(async (): Promise<void> => {
    setResending(true);
    try {
      await resendOtp(email);
      toast.success("Code sent", {
        description: `We emailed a new code to ${email}.`,
      });
    } catch (error) {
      toast.error("Couldn't resend code", {
        description: isApiError(error)
          ? error.message
          : "Please try again in a moment.",
      });
    } finally {
      setResending(false);
    }
  }, [email]);

  // Fire the auto-resend exactly once per mount — the ref guards against
  // React StrictMode's double-invoked effects in development.
  const autoResentRef = useRef(false);
  useEffect(() => {
    if (autoResend && !autoResentRef.current) {
      autoResentRef.current = true;
      void onResend();
    }
  }, [autoResend, onResend]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-3xl font-extrabold tracking-[-0.02em] text-foreground">
          Verify your email
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code we sent to{" "}
          <span className="font-medium text-foreground">{email}</span>.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="otp">Verification code</Label>
        <NumericInput
          id="otp"
          maxLength={6}
          autoComplete="one-time-code"
          aria-invalid={errors.otp ? true : undefined}
          {...register("otp")}
          className={cn(
            "h-14 text-center font-heading text-2xl font-bold tracking-[0.5em] tabular-nums placeholder:tracking-[0.5em] placeholder:font-normal placeholder:text-muted-foreground/50",
            errors.otp && "border-destructive",
          )}
          placeholder="——————"
        />
        {errors.otp && (
          <p className="text-xs text-destructive">{errors.otp.message}</p>
        )}
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} className="h-11">
        {isSubmitting ? "Verifying…" : "Verify"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Didn&apos;t get a code?{" "}
        <button
          type="button"
          onClick={onResend}
          disabled={resending}
          className="rounded-sm font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        >
          {resending ? "Sending…" : "Resend code"}
        </button>
      </p>
    </form>
  );
}
