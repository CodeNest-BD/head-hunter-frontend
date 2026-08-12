import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  REALTIME_SUBSCRIBE_STATES,
  type RealtimeChannel,
  type RealtimePostgresInsertPayload,
} from "@supabase/supabase-js";

import { useAuth } from "@/features/auth";
// Imported from the keys module directly, not the feature barrel, for the
// same reason `useConversation.ts` does: the barrel also re-exports
// components that would drag unrelated UI into every module that merely
// wants to invalidate the inbox/submissions list.
import { submissionKeys } from "@/features/submissions/keys";
import { getSupabaseClient } from "@/lib/supabase";
import { fetchRealtimeToken } from "../api/conversations";
import { conversationKeys } from "../keys";

export type ConversationRealtimeStatus = "live" | "polling";

export interface ConversationRealtimeState {
  status: ConversationRealtimeStatus;
}

/**
 * The one column this hook reads off the INSERT payload. The table is
 * `REPLICA IDENTITY FULL`, so `payload.new` carries every column,
 * snake_case as Postgres names them — the index signature is only there to
 * satisfy the Realtime client's generic constraint; this is not the full
 * row shape.
 */
interface MessageRow {
  [column: string]: unknown;
  sender_user_id: string;
}

// The token is short-lived (`expiresIn` seconds, ~15 minutes today) and
// minting one is rate-limited to 10/minute, so the socket refreshes ahead of
// expiry on its own schedule instead of waiting to be kicked off by
// `CHANNEL_ERROR` — expiry is the routine case here, not a failure path.
const TOKEN_REFRESH_SAFETY_MARGIN_SECONDS = 30;
const MIN_REFRESH_DELAY_MS = 5_000;

/**
 * Subscribes one conversation thread to Supabase Realtime's `postgres_changes`
 * feed and reports whether the socket is live or the caller should lean on
 * polling. Falls back to `"polling"` immediately when the client is
 * unconfigured, and after a resubscribe attempt also fails — never throws.
 */
export function useConversationRealtime(
  submissionId: string,
): ConversationRealtimeState {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const currentUserId = user?.id;
  const [status, setStatus] = useState<ConversationRealtimeStatus>("polling");

  useEffect(() => {
    const client = getSupabaseClient();
    setStatus("polling");
    if (!client) {
      return;
    }

    let cancelled = false;
    let channel: RealtimeChannel | null = null;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    // One re-mint-and-resubscribe attempt is allowed per failure episode.
    // A second failure in the same episode gives up rather than looping, so
    // a flaky connection cannot storm the 10/minute token-mint endpoint.
    let hasRetriedThisEpisode = false;

    const clearRefreshTimer = (): void => {
      if (refreshTimer !== undefined) {
        clearTimeout(refreshTimer);
        refreshTimer = undefined;
      }
    };

    const teardownChannel = (): void => {
      clearRefreshTimer();
      if (channel) {
        void client.removeChannel(channel);
        channel = null;
      }
    };

    // A dropped connection — network blip, idle timeout, or an explicit
    // error — gets exactly one re-mint-and-resubscribe attempt per episode;
    // a second failure in the same episode gives up. One place to edit here
    // when a backoff is added later, instead of two.
    const retryOnceThenFallback = (): void => {
      if (hasRetriedThisEpisode) {
        setStatus("polling");
        return;
      }
      hasRetriedThisEpisode = true;
      void connect();
    };

    const connect = async (): Promise<void> => {
      try {
        const { token, expiresIn } = await fetchRealtimeToken();
        if (cancelled) return;

        await client.realtime.setAuth(token);
        if (cancelled) return;

        // Captured by reference so the `.subscribe` callback below can tell a
        // genuine drop of *this* channel apart from a `CLOSED`/error event
        // arriving late for a channel this same hook already superseded:
        // `removeChannel` (used for the proactive refresh and for the retry
        // below) itself triggers this channel's own callback with `CLOSED`
        // once the server acks the leave, so without this check every
        // routine teardown would immediately retrigger a reconnect.
        const myChannel = client.channel(`conversation-${submissionId}`);
        channel = myChannel;
        myChannel
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `submission_id=eq.${submissionId}`,
            },
            (payload: RealtimePostgresInsertPayload<MessageRow>) => {
              // The sender's own subscription echoes their own INSERT back —
              // the send mutation already invalidated for it, so skip the
              // second refetch. Only skip when we can positively confirm it
              // was us; an unavailable current-user id falls back to
              // invalidating, since a redundant refetch is far cheaper than a
              // missed message.
              const authoredBySelf =
                currentUserId !== undefined &&
                payload.new.sender_user_id === currentUserId;
              if (authoredBySelf) return;

              // Invalidate rather than append: TanStack Query stays the source of truth,
              // so a missed or out-of-order event self-heals on the next fetch instead
              // of leaving the thread permanently wrong.
              //
              // `conversationKeys.all` is `["conversations"]`, a prefix of
              // `conversationKeys.unreadCount`, so this one call already
              // covers the thread *and* the sidebar unread pill by default
              // partial-key matching. The inbox/submissions list lives under
              // its own `submissionKeys` namespace, so it needs its own call
              // to reach it — that's the piece this subscription didn't
              // cover before.
              void queryClient.invalidateQueries({
                queryKey: conversationKeys.all,
              });
              void queryClient.invalidateQueries({
                queryKey: submissionKeys.all,
              });
            },
          )
          .subscribe((subscribeStatus) => {
            if (cancelled || channel !== myChannel) return;

            if (subscribeStatus === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
              hasRetriedThisEpisode = false;
              setStatus("live");
              return;
            }

            // A dropped connection can surface as any of these three — a
            // network blip, an idle timeout, or the socket closing outright
            // all mean the same thing here: retry once, then fall back.
            if (
              subscribeStatus === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR ||
              subscribeStatus === REALTIME_SUBSCRIBE_STATES.TIMED_OUT ||
              subscribeStatus === REALTIME_SUBSCRIBE_STATES.CLOSED
            ) {
              teardownChannel();
              retryOnceThenFallback();
            }
          });

        const refreshDelayMs = Math.max(
          (expiresIn - TOKEN_REFRESH_SAFETY_MARGIN_SECONDS) * 1000,
          MIN_REFRESH_DELAY_MS,
        );
        refreshTimer = setTimeout(() => {
          hasRetriedThisEpisode = false;
          teardownChannel();
          void connect();
        }, refreshDelayMs);
      } catch {
        if (cancelled) return;
        retryOnceThenFallback();
      }
    };

    void connect();

    return () => {
      cancelled = true;
      teardownChannel();
    };
  }, [submissionId, queryClient, currentUserId]);

  return { status };
}
