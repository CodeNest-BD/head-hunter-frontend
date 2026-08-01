import axios from "axios";
import { z } from "zod";

const REFRESH_TIMEOUT_MS = 15_000;
const LOGOUT_TIMEOUT_MS = 5_000;

function authBaseURL(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "";
}

const refreshResponseSchema = z.object({ accessToken: z.string().min(1) });

/**
 * POST /auth/refresh. Intentionally NOT routed through apiClient: that
 * instance's response interceptor wraps 401s with a refresh-and-retry flow, so
 * calling /auth/refresh through it would create mutual recursion. Uses bare
 * axios with `withCredentials` so the httpOnly refresh cookie is sent.
 */
export async function callRefresh(): Promise<{ accessToken: string }> {
  const response = await axios.post<unknown>(
    `${authBaseURL()}/auth/refresh`,
    null,
    { withCredentials: true, timeout: REFRESH_TIMEOUT_MS },
  );
  return refreshResponseSchema.parse(response.data);
}

/**
 * POST /auth/logout. The backend derives the user from the httpOnly refresh
 * cookie, revokes it, and clears it. Bare axios like callRefresh: there is no
 * Bearer to attach and it runs while the store is already signing out, so
 * apiClient's interceptors must not interfere.
 */
export async function callLogout(): Promise<void> {
  await axios.post(`${authBaseURL()}/auth/logout`, null, {
    withCredentials: true,
    timeout: LOGOUT_TIMEOUT_MS,
  });
}
