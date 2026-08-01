"use client";

import { Provider as ReduxProvider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "sonner";
import { store } from "@/shared/store/store";
import { queryClient } from "@/shared/libs/queryClient";
import { AuthProvider } from "@/features/auth/providers/AuthProvider";

// Google OAuth needs a real client id. When it's absent (or the build-time
// "placeholder") the Google buttons opt out entirely rather than rendering
// with a bogus id — password auth still works. See GoogleAuthButton, which
// reads the same helper to decide whether to render.
export const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function hasGoogleClientId(): boolean {
  return Boolean(googleClientId) && googleClientId !== "placeholder";
}

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Client-side provider stack for the whole app: Redux store, React Query,
 * Google OAuth, the auth lifecycle/route gate, and the toast host.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <GoogleOAuthProvider clientId={googleClientId ?? ""}>
          <AuthProvider>{children}</AuthProvider>
          <Toaster richColors position="top-right" />
        </GoogleOAuthProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}
