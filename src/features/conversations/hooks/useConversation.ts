import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";

// Imported from the keys module directly, not the feature barrel: the barrel
// also re-exports NotificationList and its hooks, which would drag the
// notifications API client into every module that merely wants to
// invalidate its badge — this hook only needs the static key array.
import { notificationKeys } from "@/features/notifications/keys";
import { candidateKeys } from "@/features/candidates/keys";
import { inboxKeys } from "@/features/inbox/keys";
import {
  fetchConversationThread,
  fetchMessageUnreadCount,
  markThreadRead,
  sendMessage,
  type SendMessageInput,
  type ThreadParams,
} from "../api/conversations";
import { REALTIME_POLL_MS } from "@/shared/libs/polling";
import { conversationKeys } from "../keys";
import type { ConversationEvent, ConversationThread } from "../schemas";
import type { ConversationParty } from "../utils/groupEvents";
import type { ConversationRealtimeStatus } from "./useConversationRealtime";

const FIRST_PAGE = 1;

// Polling is the thread's floor, not its safety net.
//
// A socket that has connected reports "live", which is not the same as "is
// delivering": if a frame never arrives, a 60s poll meant an incoming message
// sat unseen until the next tick or a window refocus, while the badges beside it
// updated on their own 5s cadence. So the fallback matches the badges, and even
// a live socket is backstopped inside a few seconds.
const POLL_INTERVAL_LIVE_MS = 15_000;
const POLL_INTERVAL_FALLBACK_MS = REALTIME_POLL_MS;

/**
 * The `{ data, meta }` envelope the API returns for `events` is one page of
 * the thread, so "load older" is naturally an infinite query: each fetched
 * page lands in TanStack Query's own page cache, and `fetchNextPage` asks for
 * the next-older page. No parallel local store accumulates history — the
 * query cache is the only place it lives.
 *
 * Polling is the baseline. Phase 8 layers realtime on top and this stays as
 * the self-healing fallback, so a dropped event is never a lost message.
 */
export function useConversationThread(
  candidateId: string,
  params: ThreadParams = {},
  realtimeStatus: ConversationRealtimeStatus = "polling",
) {
  return useInfiniteQuery({
    queryKey: conversationKeys.thread(candidateId, params),
    queryFn: ({ pageParam }) =>
      fetchConversationThread(candidateId, { ...params, page: pageParam }),
    initialPageParam: FIRST_PAGE,
    // Switching the candidate filter changes the query key, which without this
    // would blank an already-fetched thread to a skeleton. The old events stay
    // on screen until the new ones arrive; Thread marks them stale meanwhile.
    placeholderData: keepPreviousData,
    getNextPageParam: (lastPage) =>
      lastPage.events.meta.page < lastPage.events.meta.totalPages
        ? lastPage.events.meta.page + 1
        : undefined,
    refetchInterval:
      realtimeStatus === "live"
        ? POLL_INTERVAL_LIVE_MS
        : POLL_INTERVAL_FALLBACK_MS,
    refetchOnWindowFocus: true,
  });
}

export function useMessageUnreadCount() {
  return useQuery({
    queryKey: conversationKeys.unreadCount,
    queryFn: fetchMessageUnreadCount,
    // Drives the app-wide Submissions/Inbox badge, mounted on every page.
    // useUnreadRealtime (mounted once in DashboardLayout) invalidates this on
    // message.created/negotiation.changed, so this no longer polls — window
    // focus stays as the safety net for a dropped frame.
    refetchOnWindowFocus: true,
  });
}

type ThreadCache = InfiniteData<ConversationThread, number>;

/** Pages are newest-first (the API's default DESC), so page one's head is the latest entry. */
function withNewestEvent(
  cache: ThreadCache,
  event: ConversationEvent,
): ThreadCache {
  const [newest, ...older] = cache.pages;
  if (!newest) return cache;
  return {
    ...cache,
    pages: [
      {
        ...newest,
        events: { ...newest.events, data: [event, ...newest.events.data] },
      },
      ...older,
    ],
  };
}

function withoutEvent(cache: ThreadCache, messageId: string): ThreadCache {
  return {
    ...cache,
    pages: cache.pages.map((page) => ({
      ...page,
      events: {
        ...page.events,
        data: page.events.data.filter((event) => event.messageId !== messageId),
      },
    })),
  };
}

/**
 * Optimistic: the message lands in the thread the moment it is sent, shaped
 * exactly like the server's own message event, and is rolled back if the send
 * fails. Waiting for the refetch instead left a gap — the composer had
 * cleared, but the message only appeared once the thread came back.
 */
export function useSendMessage(
  candidateId: string,
  senderParty: ConversationParty,
) {
  const queryClient = useQueryClient();
  const threadKey = conversationKeys.threadsFor(candidateId);
  const mutationKey = ["send-message", candidateId];
  return useMutation({
    mutationKey,
    mutationFn: (input: SendMessageInput) => sendMessage(candidateId, input),
    onMutate: async (input) => {
      // A refetch already in flight would land without the message and wipe it.
      await queryClient.cancelQueries({ queryKey: threadKey });
      const optimisticId = `optimistic-${crypto.randomUUID()}`;
      const optimistic: ConversationEvent = {
        type: "message",
        at: new Date().toISOString(),
        actor: senderParty,
        title: "Message",
        body: input.body,
        candidateId,
        messageId: optimisticId,
        data: null,
      };
      queryClient.setQueriesData<ThreadCache>({ queryKey: threadKey }, (old) =>
        old ? withNewestEvent(old, optimistic) : old,
      );
      return { optimisticId };
    },
    // Removes only this send's own entry rather than restoring a snapshot:
    // with several sends in flight, a snapshot would also wipe the others.
    onError: (_error, _input, context) => {
      if (!context) return;
      queryClient.setQueriesData<ThreadCache>({ queryKey: threadKey }, (old) =>
        old ? withoutEvent(old, context.optimisticId) : old,
      );
    },
    // Reconcile in the background (the real message id, the inbox preview,
    // the badges) — but only once the last send in flight settles, so an
    // earlier send's refetch can't land between a later one's optimistic
    // insert and its save and wipe it. The settling mutation still counts.
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey }) > 1) return;
      void queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      void queryClient.invalidateQueries({ queryKey: inboxKeys.all });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkThreadRead(candidateId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markThreadRead(candidateId),
    // Read state appears nowhere in ConversationEventDto, so refetching the
    // thread itself can never change what renders — only the unread count, the
    // inbox badge and the notifications badge actually reflect it. The
    // candidate is invalidated because the company reading a thread is what
    // moves it off `submitted` server-side, so its status is now stale.
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.unreadCount,
      });
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.unreadCounts,
      });
      void queryClient.invalidateQueries({ queryKey: inboxKeys.all });
      void queryClient.invalidateQueries({ queryKey: candidateKeys.all });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
