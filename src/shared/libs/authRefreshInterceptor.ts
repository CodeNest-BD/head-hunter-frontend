import axios, { AxiosInstance, AxiosResponse, HttpStatusCode } from "axios";
import { refreshAccessToken } from "@/features/auth/lib/refreshClient";
import type { AuthStatus } from "@/features/auth/types";

function isRefreshOrLogoutEndpoint(url?: string): boolean {
  if (!url) return false;
  const pathname = new URL(url, "http://localhost").pathname;
  return pathname === "/auth/refresh" || pathname === "/auth/logout";
}

/**
 * Shared 401 → refresh → retry-once flow. Covers the narrow case of an access
 * token that expired mid-session: on a qualifying 401, run the single-flight
 * refresh and replay the request once with the fresh token.
 *
 * A retry only makes sense while `authenticated`. During `booting` the boot
 * refresh is already in flight, and once `unauthenticated` a retry would just
 * pile redundant /auth/refresh calls onto a settled flow.
 *
 * Returns the retried response on success, or `null` to signal "not handled —
 * continue normal error handling". A failed refresh needs nothing here:
 * refreshAccessToken already cleared the session on a 401.
 */
export async function tryAuthRefreshRetry(
  instance: AxiosInstance,
  error: unknown,
  getStatus: () => AuthStatus | undefined,
): Promise<AxiosResponse | null> {
  if (!axios.isAxiosError(error)) return null;

  const config = error.config;
  if (
    error.response?.status !== HttpStatusCode.Unauthorized ||
    !config ||
    config.__authRetried ||
    isRefreshOrLogoutEndpoint(config.url) ||
    getStatus() !== "authenticated"
  ) {
    return null;
  }

  config.__authRetried = true;
  try {
    const newAccessToken = await refreshAccessToken();
    config.headers = config.headers ?? {};
    config.headers["Authorization"] = `Bearer ${newAccessToken}`;
    return await instance(config);
  } catch {
    return null;
  }
}
