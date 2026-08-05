"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/shared/store/hooks";
import { bootFailed } from "../store/authSlice";
import { refreshAccessToken } from "../lib/refreshClient";
import { expiryMillisFromToken } from "../lib/jwt";

// Refresh this far ahead of access-token expiry so regular requests never 401.
const PROACTIVE_REFRESH_LEAD_MS = 60_000;

const LOGIN_ROUTE = "/login";
const DASHBOARD_ROUTE = "/dashboard";
// Auth-only pages an already-signed-in user has no reason to see.
const AUTH_ROUTES = new Set(["/login", "/signup", "/verify-otp"]);
// Routes that render without a session (auth pages plus the marketing homes).
const PUBLIC_ROUTES = new Set(["/", "/temp", ...AUTH_ROUTES]);

function isPublicRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return PUBLIC_ROUTES.has(pathname);
}

function isAuthRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return AUTH_ROUTES.has(pathname);
}

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Auth lifecycle owner and route gate.
 *
 * Lifecycle: on boot, attempts a silent /auth/refresh to resume a session from
 * the httpOnly cookie (refreshClient commits the result). A transient failure
 * or a genuine 401 both settle the app to `unauthenticated`. While the token is
 * live, a proactive timer refreshes just before expiry.
 *
 * Gating: protected routes render nothing until the session is known —
 * `booting` shows a lightweight loader, `unauthenticated` redirects to login.
 * Public routes always render (they need no session).
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const status = useAppSelector((s) => s.auth.status);
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const bootStarted = useRef(false);

  // Boot: exactly one silent refresh attempt. The ref guard keeps StrictMode's
  // double-invoke (and any deps-triggered re-fire) from launching a second
  // attempt. refreshClient commits the session on success and dispatches
  // sessionCleared on a 401; a transient (non-401) failure leaves status
  // "booting", so settle it to unauthenticated here rather than hanging.
  useEffect(() => {
    if (bootStarted.current) return;
    bootStarted.current = true;
    refreshAccessToken().catch(() => {
      dispatch(bootFailed());
    });
  }, [dispatch]);

  // Proactive refresh: re-arm whenever the token rotates. Scheduling ahead of
  // exp keeps regular API requests from ever 401-ing; torn down on sign-out.
  useEffect(() => {
    if (!accessToken) return;
    const expMs = expiryMillisFromToken(accessToken);
    if (!expMs) return;
    const delay = Math.max(0, expMs - Date.now() - PROACTIVE_REFRESH_LEAD_MS);
    const timer = setTimeout(() => {
      refreshAccessToken().catch(() => {});
    }, delay);
    return () => clearTimeout(timer);
  }, [accessToken]);

  // Route gate:
  //  - no session on a protected route → login.
  //  - live session sitting on an auth-only page → dashboard.
  useEffect(() => {
    if (status === "unauthenticated" && !isPublicRoute(pathname)) {
      router.replace(LOGIN_ROUTE);
    } else if (status === "authenticated" && isAuthRoute(pathname)) {
      router.replace(DASHBOARD_ROUTE);
    }
  }, [status, pathname, router]);

  if (!isPublicRoute(pathname)) {
    if (status === "booting") {
      return (
        <div className="flex min-h-screen items-center justify-center gap-2 bg-background text-sm text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
          Loading…
        </div>
      );
    }
    // Redirect effect is already navigating — don't flash a shell.
    if (status === "unauthenticated") return null;
  }

  return <>{children}</>;
}
