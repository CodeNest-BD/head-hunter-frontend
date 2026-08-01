import axios, {
  AxiosInstance,
  HttpStatusCode,
  InternalAxiosRequestConfig,
} from "axios";
import { toast } from "sonner";
import { ApiError, handleError } from "./errorHandler";
import { tryAuthRefreshRetry } from "./authRefreshInterceptor";

// Per-request guards. `suppressGlobalErrorToast` lets a caller own its own
// error UX; `__authRetried` bounds the 401 retry to a single attempt.
declare module "axios" {
  export interface AxiosRequestConfig {
    suppressGlobalErrorToast?: boolean;
    __authRetried?: boolean;
  }
  export interface InternalAxiosRequestConfig {
    suppressGlobalErrorToast?: boolean;
    __authRetried?: boolean;
  }
}

interface AuthStateSlice {
  status: "booting" | "authenticated" | "unauthenticated";
  accessToken: string | null;
}
interface StoreLike {
  getState: () => { auth: AuthStateSlice };
}

// Injected by the store module after construction — a direct import would
// create a cycle (store → apiClient → store). Until injected, requests go out
// unauthenticated (only the public auth endpoints run before boot completes).
let getState: StoreLike["getState"] | null = null;
export const injectStoreIntoApiClient = (store: StoreLike): void => {
  getState = store.getState;
};

// Endpoints that intentionally run unauthenticated — never attach a Bearer.
const PUBLIC_AUTH_ENDPOINTS = new Set([
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/verify-otp",
  "/auth/resend-otp",
  "/auth/google",
  "/auth/refresh",
  "/auth/logout",
]);

function isPublicEndpoint(url?: string): boolean {
  if (!url) return false;
  const pathname = new URL(url, "http://localhost").pathname;
  return PUBLIC_AUTH_ENDPOINTS.has(pathname);
}

function attachAuth(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  if (isPublicEndpoint(config.url) || !getState) return config;
  const token = getState().auth.accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
}

const buildResponseErrorHandler =
  (instance: AxiosInstance) =>
  async (error: unknown): Promise<import("axios").AxiosResponse> => {
    // 401 → shared single-flight refresh → retry once. Returns the retried
    // response on success; null means "continue normal error handling".
    const retried = await tryAuthRefreshRetry(
      instance,
      error,
      () => getState?.().auth.status,
    );
    if (retried) return retried;

    if (axios.isCancel(error)) throw error;

    const apiError = handleError(error);
    const config = axios.isAxiosError(error) ? error.config : undefined;
    if (!config?.suppressGlobalErrorToast) {
      toast.error("Request failed", { description: apiError.message });
    }
    throw apiError;
  };

function createApiClient(baseURL: string | undefined): AxiosInstance {
  // Fail fast on a missing env var. Without this, axios silently falls back to
  // the page origin — every API call would hit Next.js and produce confusing
  // 404s instead of a clear configuration error at boot.
  if (!baseURL) {
    throw new Error("NEXT_PUBLIC_API_URL environment variable is not set");
  }
  const instance = axios.create({ baseURL, withCredentials: true });
  instance.interceptors.request.use(
    (config) => attachAuth(config),
    (error) => Promise.reject(error),
  );
  instance.interceptors.response.use(
    (response) => response,
    buildResponseErrorHandler(instance),
  );
  return instance;
}

export const apiClient = createApiClient(process.env.NEXT_PUBLIC_API_URL);

export { HttpStatusCode };
