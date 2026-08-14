import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
// Imported from the keys module directly, not the feature barrel: the barrel
// also re-exports components that would drag unrelated UI into every module
// that merely wants to invalidate the inbox/submissions list.
import { submissionKeys } from "@/features/submissions/keys";
import { getConversationSocket } from "@/lib/socket";
import { useAppSelector } from "@/shared/store/hooks";
import { conversationKeys } from "../keys";

export type ConversationRealtimeStatus = "live" | "polling";

export interface ConversationRealtimeState {
  status: ConversationRealtimeStatus;
}

/** Mirrors MessageCreatedPayload in the API's libs/common/src/ws/conversation-events.ts. */
interface MessageCreatedFrame {
  submissionId: string;
  messageId: string;
  senderUserId: string;
  createdAt: string;
}

const MESSAGE_CREATED = "message.created";

const isMessageCreatedFrame = (
  payload: unknown,
): payload is MessageCreatedFrame => {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }
  if (
    !("submissionId" in payload) ||
    !("senderUserId" in payload) ||
    !("messageId" in payload) ||
    !("createdAt" in payload)
  ) {
    return false;
  }
  return (
    typeof payload.submissionId === "string" &&
    typeof payload.senderUserId === "string" &&
    typeof payload.messageId === "string" &&
    typeof payload.createdAt === "string"
  );
};

/**
 * Subscribes one thread to the API's conversations gateway and reports whether
 * the socket is live or the caller should lean on polling. Falls back to
 * `"polling"` when the socket is unconfigured or drops — never throws.
 *
 * The socket carries no message content, so every frame is handled the same way:
 * invalidate and let TanStack Query refetch through the authorized REST path. A
 * missed or out-of-order frame therefore self-heals on the next fetch rather than
 * leaving the thread permanently wrong.
 *
 * There is no token-refresh machinery here on purpose: the socket's `auth`
 * callback re-reads the access token before every reconnect, and socket.io owns
 * the backoff.
 */
export function useConversationRealtime(
  submissionId: string,
): ConversationRealtimeState {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const currentUserId = user?.id;
  const [status, setStatus] = useState<ConversationRealtimeStatus>("polling");
  // Dependency-only: not read below. A gateway that refuses a stale token's
  // handshake disconnects with reason "io server disconnect", which
  // socket.io-client deliberately does not auto-retry, so the effect must
  // re-run — and reconnect — once the store actually has a fresh token.
  // Do not remove this as unused; it is what makes that retry happen at all.
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  // Ref, not state: recording the last-refused token must not itself trigger
  // a re-render or re-run this effect — only `accessToken` changing should.
  const lastRefusedTokenRef = useRef<string | null | undefined>(undefined);

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
      // socket.io-client will not retry on its own. But retrying unconditionally
      // here would bypass socket.io's own reconnection backoff, which is the
      // only thing bounding handshake attempt rate against the backend (this
      // endpoint isn't covered by ThrottlerGuard) — a stale token that never
      // gets refreshed would otherwise retry in a tight loop for as long as the
      // tab is open. So retry only when the token has changed since the
      // attempt that was just refused: that is the only condition under which
      // the refusal's cause could plausibly be gone. Do not remove this guard.
      if (
        reason === "io server disconnect" &&
        accessToken !== lastRefusedTokenRef.current
      ) {
        lastRefusedTokenRef.current = accessToken;
        socket.connect();
      }
    };

    const onMessageCreated = (payload: unknown): void => {
      if (!isMessageCreatedFrame(payload)) {
        return;
      }
      if (payload.submissionId !== submissionId) {
        return;
      }
      // The sender's own send mutation already invalidated, so skip the second
      // refetch. Only skip when we can positively confirm it was us: an
      // unavailable current-user id falls through to invalidating, because a
      // redundant refetch is far cheaper than a missed message.
      if (currentUserId !== undefined && payload.senderUserId === currentUserId) {
        return;
      }

      // `conversationKeys.all` is `["conversations"]`, a prefix of
      // `conversationKeys.unreadCount`, so this one call covers the thread and
      // the sidebar unread pill by partial-key matching. The inbox lives under
      // its own namespace and needs its own call.
      void queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      void queryClient.invalidateQueries({ queryKey: submissionKeys.all });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on(MESSAGE_CREATED, onMessageCreated);
    if (socket.connected) {
      setStatus("live");
    }
    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off(MESSAGE_CREATED, onMessageCreated);
      // The socket is shared app-wide and deliberately left connected; only this
      // hook's listeners come off.
    };
  }, [submissionId, queryClient, currentUserId, accessToken]);

  return { status };
}
