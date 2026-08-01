"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { isApiError } from "@/shared/libs/errorHandler";
import { otpSchema, type OtpFormData } from "../schemas";
import { verifyOtp, resendOtp } from "../api/auth";
import { useAuth } from "../hooks/useAuth";

interface OtpFormProps {
  email: string;
}

export function OtpForm({ email }: OtpFormProps) {
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

  const onResend = async (): Promise<void> => {
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
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full max-w-sm flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm"
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Verify your email
        </h1>
        <p className="text-sm text-zinc-500">
          Enter the code we sent to <span className="font-medium">{email}</span>
          .
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="otp" className="text-sm font-medium text-zinc-900">
          Verification code
        </label>
        <input
          id="otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          {...register("otp")}
          className="h-10 rounded-md border border-zinc-200 px-3 text-sm tracking-widest outline-none focus:border-zinc-900"
          placeholder="123456"
        />
        {errors.otp && (
          <p className="text-xs text-red-500">{errors.otp.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-10 rounded-md bg-zinc-900 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60"
      >
        {isSubmitting ? "Verifying…" : "Verify"}
      </button>

      <button
        type="button"
        onClick={onResend}
        disabled={resending}
        className="text-sm text-zinc-600 underline disabled:opacity-60"
      >
        {resending ? "Sending…" : "Resend code"}
      </button>
    </form>
  );
}
