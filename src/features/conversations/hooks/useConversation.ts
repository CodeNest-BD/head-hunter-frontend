import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

// Imported from the keys module directly, not the feature barrel: the barrel
// also re-exports NotificationList and its hooks, which would drag the
// notifications API client into every module that merely wants to
// invalidate its badge — this hook only needs the static key array.
import { notificationKeys } from "@/features/notifications/keys";
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
  submissionId: string,
  params: ThreadParams = {},
  realtimeStatus: ConversationRealtimeStatus = "polling",
) {
  return useInfiniteQuery({
    queryKey: conversationKeys.thread(submissionId, params),
    queryFn: ({ pageParam }) =>
      fetchConversationThread(submissionId, { ...params, page: pageParam }),
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

export function useSendMessage(submissionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SendMessageInput) => sendMessage(submissionId, input),
    // A new message changes both the thread (it has a new entry) and the
    // notifications badge, so both key sets are invalidated together.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkThreadRead(submissionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markThreadRead(submissionId),
    // Read state appears nowhere in ConversationEventDto, so refetching the
    // thread itself can never change what renders — only the unread count and
    // the notifications badge actually reflect it.
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.unreadCount,
      });
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.unreadCounts,
      });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
