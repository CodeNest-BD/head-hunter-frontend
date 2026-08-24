import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuthStatus, AuthUser } from "../types";

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
}

const initialState: AuthState = {
  status: "booting",
  user: null,
  accessToken: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /** A session was established (login, OTP verify, boot refresh, rotation). */
    sessionEstablished(
      state,
      action: PayloadAction<{ accessToken: string; user: AuthUser }>,
    ) {
      state.status = "authenticated";
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
    },
    /**
     * The access token rotated but the profile is already known — keep `user`
     * and just swap the token (used by the 401-retry / proactive refresh flow).
     */
    tokenRotated(state, action: PayloadAction<{ accessToken: string }>) {
      if (state.status === "authenticated") {
        state.accessToken = action.payload.accessToken;
      }
    },
    /**
     * The account's own details changed under an established session — the
     * profile screens edit the User row, and the header reads its copy from
     * here, so without this the old name stays on screen until the next boot.
     */
    accountDetailsUpdated(
      state,
      action: PayloadAction<Pick<AuthUser, "firstName" | "lastName" | "phone">>,
    ) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },

    /** No session: boot resolved signed-out, logout, or a refresh 401. */
    sessionCleared(state) {
      state.status = "unauthenticated";
      state.user = null;
      state.accessToken = null;
    },
    /** Boot's silent refresh resolved with no session. */
    bootFailed(state) {
      state.status = "unauthenticated";
      state.user = null;
      state.accessToken = null;
    },
  },
});

export const {
  sessionEstablished,
  tokenRotated,
  accountDetailsUpdated,
  sessionCleared,
  bootFailed,
} = authSlice.actions;
export default authSlice.reducer;
