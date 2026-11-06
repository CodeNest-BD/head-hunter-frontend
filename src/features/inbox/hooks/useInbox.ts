import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { REALTIME_POLL_MS } from "@/shared/libs/polling";

import {
  fetchCompanySubmissionStats,
  fetchCompanySubmissions,
  fetchInboxAttentionCount,
  fetchInboxConversations,
  fetchInboxJobs,
  type CompanySubmissionsParams,
  type InboxConversationsParams,
  type InboxJobsParams,
  type InboxSide,
} from "../api/inbox";
import { inboxKeys } from "../keys";
import type { InboxConversationRow } from "../schemas";
import { IN_PROCESS_CANDIDATE_STATUSES } from "@/features/candidates/schemas";
import type { Paginated } from "@/shared/libs/pagination";

/** The flat inbox list: threads most-recent first, refreshed like the badge. */
export function useInboxConversations(
  side: InboxSide,
  params: InboxConversationsParams,
) {
  return useQuery({
    queryKey: inboxKeys.conversations(side, params),
    queryFn: () => fetchInboxConversations(side, params),
    placeholderData: keepPreviousData,
    refetchInterval: REALTIME_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useInboxJobs(side: InboxSide, params: InboxJobsParams) {
  return useQuery({
    queryKey: inboxKeys.jobs(side, params),
    queryFn: () => fetchInboxJobs(side, params),
    // Keep the current page visible while the next page/search loads.
    placeholderData: keepPreviousData,
  });
}

/**
 * The number behind the Inbox nav badge: candidates waiting on this caller.
 *
 * Polls on the notifications' interval and refetches on focus, overriding the
 * app-wide `refetchOnWindowFocus: false`. A candidate can arrive with no
 * message at all — the pitch is optional — so there is no socket event to wait
 * on for the case the badge exists to cover.
 */
export function useInboxAttentionCount(side: InboxSide) {
  return useQuery({
    queryKey: inboxKeys.attentionCount(side),
    queryFn: () => fetchInboxAttentionCount(side),
    refetchInterval: REALTIME_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

/**
 * How many threads match a filter, without fetching them.
 *
 * `limit: 1` and read `meta.total`: the server already counts the filtered
 * set, and that count is exact at any size. Counting a fetched page instead
 * silently under-reports the moment a recruiter has more threads than the
 * page holds — and the dashboard card links to a list that *is* server
 * filtered and paginated, so the tile and the list it opens would disagree
 * for precisely the busiest recruiters.
 *
 * A dedicated query rather than `useInboxConversations`: that one polls every
 * five seconds because it backs a live inbox, and a dashboard summary neither
 * needs nor deserves that.
 */
function useConversationTotal(params: InboxConversationsParams) {
  return useQuery({
    queryKey: inboxKeys.conversations("recruiter", params),
    queryFn: () => fetchInboxConversations("recruiter", params),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    select: (page: Paginated<InboxConversationRow>) => page.meta.total,
  });
}

// The same constants the dashboard builds its card links from, so a card's
// figure and the list it opens are filtered by one definition rather than two.
const IN_PROCESS_PARAMS: InboxConversationsParams = {
  limit: 1,
  status: IN_PROCESS_CANDIDATE_STATUSES,
};
const OFFERED_PARAMS: InboxConversationsParams = {
  limit: 1,
  status: ["offered"],
};

/** The recruiter dashboard's two pipeline figures, counted server-side. */
export function useRecruiterPipelineCounts() {
  const inProcess = useConversationTotal(IN_PROCESS_PARAMS);
  const newOffers = useConversationTotal(OFFERED_PARAMS);

  return {
    // Each card shows its own skeleton, so a figure is pending only while its
    // own count is.
    inProcess: inProcess.data,
    newOffers: newOffers.data,
    isInProcessPending: inProcess.isPending,
    isNewOffersPending: newOffers.isPending,
  };
}

export function useCompanySubmissions(params: CompanySubmissionsParams) {
  return useQuery({
    queryKey: inboxKeys.submissions(params),
    queryFn: () => fetchCompanySubmissions(params),
    placeholderData: keepPreviousData,
    // Poll like the sidebar badge so a candidate submitted while the company
    // sits on the queue appears without a manual refresh — otherwise the badge
    // would increment while the table and its counts stayed stale.
    refetchInterval: REALTIME_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useCompanySubmissionStats(jobId?: string) {
  return useQuery({
    queryKey: inboxKeys.submissionStats(jobId),
    queryFn: () => fetchCompanySubmissionStats(jobId),
    placeholderData: keepPreviousData,
    refetchInterval: REALTIME_POLL_MS,
    refetchOnWindowFocus: true,
  });
}
