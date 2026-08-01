import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/store/authSlice";
import { injectStoreIntoApiClient } from "@/shared/libs/apiClient";
import { injectDepsIntoRefreshClient } from "@/features/auth/lib/refreshClient";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

// Wire the store into the api client + refresh client so their interceptors
// can read the current access token / auth status and commit refreshed
// sessions. Done via injection (not direct imports) to avoid a module cycle:
// store → apiClient → refreshClient → store.
injectStoreIntoApiClient(store);
injectDepsIntoRefreshClient({
  dispatch: store.dispatch,
  getAuth: () => {
    const { status, user } = store.getState().auth;
    return { status, user };
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
