import { useEffect, useRef, useState } from "react";

import { getConversationSocket } from "@/lib/socket";
import { useAppSelector } from "@/shared/store/hooks";

export type ConversationSocketStatus = "live" | "polling";

/** Frame handlers by event name. Payloads arrive untyped off the wire, so each
 * handler narrows what it was given before trusting it. */
export type ConversationFrameHandlers = Record<
  string,
  (payload: unknown) => void
>;

/**
 * Owns the app-wide conversations socket's connection lifecycle, and binds the
 * caller's frame handlers for as long as the caller is mounted.
 *
 * Both realtime hooks go through here — the per-thread `useConversationRealtime`
 * and the global `useUnreadRealtime` — so the reconnect reasoning below lives in
 * exactly one place. A second copy is what let the unread badges silently stop
 * updating for the life of a tab.
 *
 * Reports `"live"`/`"polling"` so a caller can tell the user whether it is
 * hearing about changes as they happen. Never throws: an unconfigured socket is
 * simply permanent `"polling"`.
 */
export function useConversationSocket(
  handlers: ConversationFrameHandlers,
): ConversationSocketStatus {
  const [status, setStatus] = useState<ConversationSocketStatus>("polling");
  // A gateway that refuses a stale token's handshake disconnects with reason
  // "io server disconnect", which socket.io-client deliberately does not
  // auto-retry, so this effect must re-run — and reconnect — once the store
  // actually has a fresh token. Do not drop this dependency.
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  // Ref, not state: recording the last-refused token must not itself trigger a
  // re-render or re-run this effect — only `accessToken` changing should.
  const lastRefusedTokenRef = useRef<string | null | undefined>(undefined);
  // Callers rebuild their handler closures on every render (they read props and
  // query state), so holding them behind a ref keeps the subscription keyed to
  // the token alone: no listener churn per render, while every frame still
  // reaches the newest closure.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const socket = getConversationSocket();
    if (!socket) {
      setStatus("polling");
      return;
    }

    const onConnect = (): void => setStatus("live");
    const onDisconnect = (reason: string): void => {
      setStatus("polling");
      // The gateway refuses a bad handshake with `client.disconnect(true)`,
      // which reaches the client as this exact reason — the one disconnect
      // socket.io-client will not retry on its own. But retrying
      // unconditionally here would bypass socket.io's own reconnection
      // backoff, which is the only thing bounding handshake attempt rate
      // against the backend (this endpoint isn't covered by ThrottlerGuard) —
      // a stale token that never gets refreshed would otherwise retry in a
      // tight loop for as long as the tab is open. So retry only when the
      // token has changed since the attempt that was just refused: that is the
      // only condition under which the refusal's cause could plausibly be
      // gone. Do not remove this guard.
      if (
        reason === "io server disconnect" &&
        accessToken !== lastRefusedTokenRef.current
      ) {
        lastRefusedTokenRef.current = accessToken;
        socket.connect();
      }
    };

    const bound = Object.keys(handlersRef.current).map((event) => {
      const listener = (payload: unknown): void => {
        handlersRef.current[event]?.(payload);
      };
      socket.on(event, listener);
      return { event, listener };
    });

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    if (socket.connected) {
      setStatus("live");
    }
    // `getConversationSocket()` returns the socket with `autoConnect: false`,
    // and `connect()` on an already-connected socket is a no-op — so every
    // caller connecting is both necessary (a page may mount only one of them)
    // and safe.
    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      for (const { event, listener } of bound) {
        socket.off(event, listener);
      }
      // The socket is shared app-wide and deliberately left connected; only
      // this caller's listeners come off.
    };
  }, [accessToken]);

  return status;
}
