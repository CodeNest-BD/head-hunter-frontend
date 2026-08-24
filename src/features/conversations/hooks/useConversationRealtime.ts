import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
// Imported from the keys module directly, not the feature barrel: the barrel
// also re-exports components that would drag unrelated UI into every module
// that merely wants to invalidate the inbox list.
import { candidateKeys } from "@/features/candidates/keys";
import { interviewKeys } from "@/features/interviews/keys";
import { offerKeys } from "@/features/offers/keys";
import { inboxKeys } from "@/features/inbox/keys";
import { CONVERSATION_EVENT } from "../events";
import { conversationKeys } from "../keys";
import {
  useConversationSocket,
  type ConversationSocketStatus,
} from "./useConversationSocket";

export type ConversationRealtimeStatus = ConversationSocketStatus;

export interface ConversationRealtimeState {
  status: ConversationRealtimeStatus;
}

/** Mirrors MessageCreatedPayload in the API's libs/common/src/ws/conversation-events.ts. */
interface MessageCreatedFrame {
  candidateId: string;
  messageId: string;
  senderUserId: string;
  createdAt: string;
}

const isMessageCreatedFrame = (
  payload: unknown,
): payload is MessageCreatedFrame => {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }
  if (
    !("candidateId" in payload) ||
    !("senderUserId" in payload) ||
    !("messageId" in payload) ||
    !("createdAt" in payload)
  ) {
    return false;
  }
  return (
    typeof payload.candidateId === "string" &&
    typeof payload.senderUserId === "string" &&
    typeof payload.messageId === "string" &&
    typeof payload.createdAt === "string"
  );
};

interface NegotiationChangedFrame {
  candidateId: string;
  kind: string;
}

const isNegotiationChangedFrame = (
  payload: unknown,
): payload is NegotiationChangedFrame => {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }
  if (!("candidateId" in payload) || !("kind" in payload)) {
    return false;
  }
  return (
    typeof payload.candidateId === "string" && typeof payload.kind === "string"
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
 * the backoff. Connecting, and reviving a connection the gateway refused, is
 * `useConversationSocket`'s concern — shared with `useUnreadRealtime`.
 */
export function useConversationRealtime(
  candidateId: string,
): ConversationRealtimeState {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const currentUserId = user?.id;

  const status = useConversationSocket({
    [CONVERSATION_EVENT.MESSAGE_CREATED]: (payload: unknown): void => {
      if (!isMessageCreatedFrame(payload)) {
        return;
      }
      if (payload.candidateId !== candidateId) {
        return;
      }
      // The sender's own send mutation already invalidated, so skip the second
      // refetch. Only skip when we can positively confirm it was us: an
      // unavailable current-user id falls through to invalidating, because a
      // redundant refetch is far cheaper than a missed message.
      if (
        currentUserId !== undefined &&
        payload.senderUserId === currentUserId
      ) {
        return;
      }

      // `conversationKeys.all` is `["conversations"]`, a prefix of
      // `conversationKeys.unreadCount`, so this one call covers the thread and
      // the sidebar unread pill by partial-key matching. The inbox lives under
      // its own namespace and needs its own call.
      void queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      void queryClient.invalidateQueries({ queryKey: inboxKeys.all });
    },

    // The party who did not act has no mutation of their own to learn from. The
    // frame carries no state, so a missed one self-heals on the next poll.
    [CONVERSATION_EVENT.NEGOTIATION_CHANGED]: (payload: unknown): void => {
      if (!isNegotiationChangedFrame(payload)) {
        return;
      }
      if (payload.candidateId !== candidateId) {
        return;
      }
      void queryClient.invalidateQueries({ queryKey: offerKeys.all });
      void queryClient.invalidateQueries({ queryKey: interviewKeys.all });
      void queryClient.invalidateQueries({ queryKey: candidateKeys.all });
      void queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      void queryClient.invalidateQueries({ queryKey: inboxKeys.all });
    },
  });

  return { status };
}
