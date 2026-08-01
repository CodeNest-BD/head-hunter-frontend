import axios from "axios";
import { apiClient } from "@/shared/libs/apiClient";
import { authUserSchema, type AuthUser } from "../types";

function authBaseURL(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "";
}

/**
 * GET /auth/me → the authenticated user's profile.
 *
 * When `accessToken` is passed (the boot / refresh path), the request goes out
 * on bare axios with that Bearer explicitly — the token has not yet been
 * committed to the store, so apiClient's interceptor couldn't attach it. When
 * omitted, it rides the shared apiClient (Bearer from the store, plus the
 * 401→refresh flow).
 */
export async function fetchMe(accessToken?: string): Promise<AuthUser> {
  const data = accessToken
    ? (
        await axios.get<unknown>(`${authBaseURL()}/auth/me`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      ).data
    : (await apiClient.get<unknown>("/auth/me")).data;
  return authUserSchema.parse(data);
}
