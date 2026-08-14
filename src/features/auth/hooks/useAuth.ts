import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/shared/store/hooks";
import { resetConversationSocket } from "@/lib/socket";
import { sessionEstablished, sessionCleared } from "../store/authSlice";
import { fetchMe } from "../api/me";
import { callLogout } from "../api/refresh";

/**
 * Auth actions + a live read of the session for components.
 *
 * `establishSession` is the single commit path after any token-minting call
 * (sign-in, OTP verify, google): it fetches the profile, commits the session,
 * and routes to the dashboard. Keeping it here means the API modules stay pure
 * (they only return the token) and every entry point converges on one flow.
 */
export function useAuth() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const status = useAppSelector((s) => s.auth.status);
  const user = useAppSelector((s) => s.auth.user);

  const establishSession = useCallback(
    async (accessToken: string): Promise<void> => {
      const profile = await fetchMe(accessToken);
      dispatch(sessionEstablished({ accessToken, user: profile }));
      router.replace("/dashboard");
    },
    [dispatch, router],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await callLogout();
    } finally {
      dispatch(sessionCleared());
      resetConversationSocket();
      router.replace("/login");
    }
  }, [dispatch, router]);

  return { status, user, establishSession, logout };
}
