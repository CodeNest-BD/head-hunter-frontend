"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { HttpStatusCode } from "@/shared/libs/apiClient";
import { isApiError } from "@/shared/libs/errorHandler";
import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import { PasswordInput } from "@/shared/ui-components/controls/password-input";
import { Label } from "@/shared/ui-components/controls/label";
import { signInSchema, type SignInFormData } from "../schemas";
import { signIn } from "../api/auth";
import { useAuth } from "../hooks/useAuth";
import { GoogleAuthButton } from "./GoogleAuthButton";

/**
 * Sign-in returns 403 for two distinct states — an unverified email and a
 * suspended account — so the message is chosen by the reason, not the status
 * alone. Only the unverified case has a self-service fix (verify), so it is the
 * only one we redirect.
 */
function isUnverifiedError(error: unknown): boolean {
  return (
    isApiError(error) &&
    error.statusCode === HttpStatusCode.Forbidden &&
    // Prefer the stable server code; fall back to the message so this still
    // works against a backend that predates the code.
    (error.code === "email_not_verified" || /verif/i.test(error.message))
  );
}

function signInErrorMessage(error: unknown): string {
  if (!isApiError(error)) return "Something went wrong. Please try again.";
  switch (error.statusCode) {
    case HttpStatusCode.Unauthorized:
      return "Incorrect email or password.";
    case HttpStatusCode.Forbidden:
      return isUnverifiedError(error)
        ? "Please verify your email before signing in."
        : "Your account isn't active. Please contact support.";
    case HttpStatusCode.BadRequest:
      return "This account uses Google sign-in. Continue with Google below.";
    default:
      return error.message;
  }
}

export function SignInForm() {
  const { establishSession } = useAuth();
  const router = useRouter();
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
      // An unverified account isn't a dead end: send them to the verify screen
      // (with a fresh code auto-sent) so they can finish signing in.
      if (isUnverifiedError(error)) {
        toast("Verify your email", {
          description: "We're sending a new code so you can finish signing in.",
        });
        router.push(
          `/verify-otp?email=${encodeURIComponent(data.email)}&resend=1`,
        );
        return;
      }
      toast.error("Sign in failed", { description: signInErrorMessage(error) });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-3xl font-extrabold tracking-[-0.02em] text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your Head-Hunters account.
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

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          aria-invalid={errors.password ? true : undefined}
          {...register("password")}
          className={cn("h-11", errors.password && "border-destructive")}
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} className="h-11">
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>

      <GoogleAuthButton />

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="rounded-sm font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
