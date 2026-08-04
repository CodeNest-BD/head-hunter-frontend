import { z } from "zod";
import { apiClient } from "@/shared/libs/apiClient";
import type { SignupRole } from "../types";
import type { SignUpPayload } from "../schemas";

const accessTokenResponse = z.object({ accessToken: z.string().min(1) });
export type AccessTokenResponse = z.infer<typeof accessTokenResponse>;

const signUpResponse = z.object({
  id: z.string(),
  email: z.string().email(),
});
export type SignUpResponse = z.infer<typeof signUpResponse>;

const successResponse = z.object({ success: z.boolean() });

/** POST /auth/sign-up → 201 { id, email }. User must then verify an OTP. */
export async function signUp(input: SignUpPayload): Promise<SignUpResponse> {
  const { data } = await apiClient.post<unknown>("/auth/sign-up", input, {
    suppressGlobalErrorToast: true,
  });
  return signUpResponse.parse(data);
}

/** POST /auth/verify-otp → 200 { accessToken } (+ refresh cookie). */
export async function verifyOtp(input: {
  email: string;
  otp: string;
}): Promise<AccessTokenResponse> {
  const { data } = await apiClient.post<unknown>("/auth/verify-otp", input, {
    suppressGlobalErrorToast: true,
  });
  return accessTokenResponse.parse(data);
}

/** POST /auth/resend-otp → 200 { success: true }. */
export async function resendOtp(email: string): Promise<void> {
  const { data } = await apiClient.post<unknown>(
    "/auth/resend-otp",
    { email },
    { suppressGlobalErrorToast: true },
  );
  successResponse.parse(data);
}

/**
 * POST /auth/sign-in → 200 { accessToken } (+ refresh cookie).
 * Errors: 401 invalid, 403 email-not-verified, 400 google-only account.
 */
export async function signIn(input: {
  email: string;
  password: string;
}): Promise<AccessTokenResponse> {
  const { data } = await apiClient.post<unknown>("/auth/sign-in", input, {
    suppressGlobalErrorToast: true,
  });
  return accessTokenResponse.parse(data);
}

/**
 * POST /auth/google → 200 { accessToken }.
 * On the signup page, pass the chosen `role` (and optional `name`) so the
 * backend can provision a new google user. On the login page, omit them
 * (login-only): a new google user then yields 409 `role_required`.
 */
export async function googleLogin(input: {
  credential: string;
  role?: SignupRole;
  name?: string;
}): Promise<AccessTokenResponse> {
  const { data } = await apiClient.post<unknown>("/auth/google", input, {
    suppressGlobalErrorToast: true,
  });
  return accessTokenResponse.parse(data);
}
