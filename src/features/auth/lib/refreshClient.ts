import axios from "axios";
import { resetConversationSocket } from "@/lib/socket";
import { callRefresh } from "../api/refresh";
import { fetchMe } from "../api/me";
import {
  sessionEstablished,
  sessionCleared,
  tokenRotated,
} from "../store/authSlice";
import type { AuthUser } from "../types";

interface AuthSnapshot {
  status: "booting" | "authenticated" | "unauthenticated";
  user: AuthUser | null;
}
interface RefreshDeps {
  dispatch: (action: unknown) => void;
  getAuth: () => AuthSnapshot;
}

// Injected by the store module after construction — a direct import would
// create a cycle (store → apiClient → authRefreshInterceptor → refreshClient →
// store). Every refresh commits its result through this.
let deps: RefreshDeps | null = null;
export const injectDepsIntoRefreshClient = (d: RefreshDeps): void => {
  deps = d;
};

// Coalesce concurrent callers (boot, proactive timer, 401-retry interceptor)
// onto one in-flight /auth/refresh so a burst rotates the cookie only once.
let inFlight: Promise<string> | null = null;

/**
 * Single-flight POST /auth/refresh. Commits the result to the store:
 * `sessionEstablished` (with a fresh /auth/me) when no session is live yet
 * (boot), or `tokenRotated` when already authenticated (mid-session token
 * expiry — the profile is unchanged, so skip the extra /auth/me round-trip).
 * A 401 clears the session; transient network/5xx failures are re-thrown and
 * deliberately leave the session untouched.
 */
export async function refreshAccessToken(): Promise<string> {
  const wired = deps;
  if (!wired) {
    throw new Error(
      "refreshClient: deps not injected. The store must call injectDepsIntoRefreshClient before any auth-aware request fires.",
    );
  }
  if (inFlight) return inFlight;

  inFlight = callRefresh()
    .then(async ({ accessToken }) => {
      const alreadyAuthed =
        wired.getAuth().status === "authenticated" &&
        wired.getAuth().user !== null;
      if (alreadyAuthed) {
        wired.dispatch(tokenRotated({ accessToken }));
        return accessToken;
      }
      const user = await fetchMe(accessToken);
      wired.dispatch(sessionEstablished({ accessToken, user }));
      return accessToken;
    })
    .catch((err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        wired.dispatch(sessionCleared());
        resetConversationSocket();
      }
      throw err;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}
