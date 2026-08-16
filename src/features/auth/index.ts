"use client";

// The barrel is a client boundary: it re-exports hooks and components that
// use client-only React APIs, so a Server Component importing this file must
// not pull them into the server graph.
/**
 * Public surface of the auth feature. Internals (api/, store/, lib/) stay
 * private so the session mechanics can change without touching consumers.
 */
export { SignInForm } from "./components/SignInForm";
export { SignUpForm } from "./components/SignUpForm";
export { OtpForm } from "./components/OtpForm";
export { ForgotPasswordForm } from "./components/ForgotPasswordForm";
export { ResetPasswordForm } from "./components/ResetPasswordForm";
export { RequireRole } from "./components/RequireRole";
export { GoogleAuthButton } from "./components/GoogleAuthButton";
export { AuthProvider } from "./providers/AuthProvider";
export { useAuth } from "./hooks/useAuth";
export { roleSchema, signupRoleSchema } from "./types";
export type { AuthUser, AuthStatus, Role, SignupRole } from "./types";
