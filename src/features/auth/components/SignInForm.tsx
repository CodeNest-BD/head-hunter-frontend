"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { HttpStatusCode } from "@/shared/libs/apiClient";
import { isApiError } from "@/shared/libs/errorHandler";
import { signInSchema, type SignInFormData } from "../schemas";
import { signIn } from "../api/auth";
import { useAuth } from "../hooks/useAuth";
import { GoogleAuthButton } from "./GoogleAuthButton";

function signInErrorMessage(error: unknown): string {
  if (!isApiError(error)) return "Something went wrong. Please try again.";
  switch (error.statusCode) {
    case HttpStatusCode.Unauthorized:
      return "Incorrect email or password.";
    case HttpStatusCode.Forbidden:
      return "Please verify your email before signing in.";
    case HttpStatusCode.BadRequest:
      return "This account uses Google sign-in. Continue with Google below.";
    default:
      return error.message;
  }
}

export function SignInForm() {
  const { establishSession } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({ resolver: zodResolver(signInSchema) });

  const onSubmit = async (data: SignInFormData): Promise<void> => {
    try {
      const { accessToken } = await signIn(data);
      await establishSession(accessToken);
    } catch (error) {
      toast.error("Sign in failed", { description: signInErrorMessage(error) });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full max-w-sm flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm"
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Welcome back
        </h1>
        <p className="text-sm text-zinc-500">Sign in to your account.</p>
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
          autoComplete="current-password"
          {...register("password")}
          className="h-10 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-900"
          placeholder="••••••••"
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
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-zinc-200" />
        <span className="text-xs uppercase tracking-wide text-zinc-400">
          or
        </span>
        <span className="h-px flex-1 bg-zinc-200" />
      </div>

      <GoogleAuthButton />

      <p className="text-center text-sm text-zinc-600">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-zinc-900 underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
