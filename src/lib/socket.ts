import { io, type Socket } from "socket.io-client";

/**
 * One socket for the whole app, on the API's `/conversations` namespace.
 *
 * Auth uses socket.io's callback form, which runs before every connection AND
 * every reconnection attempt. That is what lets a rotated access token be picked
 * up with no timer of our own — the access token is short-lived, and the store's
 * `tokenRotated` keeps the current one there.
 *
 * Returns null when the API URL is unconfigured, so the thread degrades to
 * polling instead of throwing at module load.
 *
 * The store is injected rather than imported directly: importing it would
 * eagerly evaluate `@/shared/store/store`, which wires up `apiClient` at
 * module load, and `apiClient` throws when `NEXT_PUBLIC_API_URL` is unset.
 * A direct import would make this module unloadable in any environment
 * without that variable — including this app's own test environment.
 * Mirrors `injectStoreIntoApiClient` in `store.ts`.
 */
type TokenReader = () => string | null;

let readToken: TokenReader | null = null;

/** Injected by the store module, mirroring injectStoreIntoApiClient. */
export const injectTokenReaderIntoSocket = (reader: TokenReader): void => {
  readToken = reader;
};

let socket: Socket | null | undefined;

export function getConversationSocket(): Socket | null {
  if (socket !== undefined) {
    return socket;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    socket = null;
    return socket;
  }

  // NEXT_PUBLIC_API_URL carries the REST version prefix (".../v1"); the socket
  // attaches to the origin, so strip everything after it.
  const origin = new URL(apiUrl).origin;

  socket = io(`${origin}/conversations`, {
    autoConnect: false,
    withCredentials: true,
    auth: (callback: (payload: { token: string | null }) => void) => {
      callback({ token: readToken ? readToken() : null });
    },
  });
  return socket;
}

/**
 * Tears down the shared socket when a session ends (logout, or a refresh
 * that comes back 401). Without this, the socket stays connected — `connect()`
 * on an already-connected socket is a no-op — so it never re-reads `auth` and
 * stays joined to the previous user's room for the rest of the tab's life.
 *
 * Resets to `undefined`, not `null`: `null` is the memoized "API URL
 * unconfigured" state, and setting it here would wrongly pin the socket to
 * that state instead of letting the next `getConversationSocket()` rebuild it.
 */
export const resetConversationSocket = (): void => {
  socket?.disconnect();
  socket = undefined;
};
