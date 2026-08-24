import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { REALTIME_POLL_MS } from "@/shared/libs/polling";

import {
  fetchInboxAttentionCount,
  fetchInboxCandidates,
  fetchInboxJobs,
  type InboxCandidatesParams,
  type InboxJobsParams,
  type InboxSide,
} from "../api/inbox";
import { inboxKeys } from "../keys";

export function useInboxJobs(side: InboxSide, params: InboxJobsParams) {
  return useQuery({
    queryKey: inboxKeys.jobs(side, params),
    queryFn: () => fetchInboxJobs(side, params),
    // Keep the current page visible while the next page/search loads.
    placeholderData: keepPreviousData,
  });
}

export function useInboxCandidates(
  side: InboxSide,
  jobId: string,
  params: InboxCandidatesParams,
) {
  return useQuery({
    queryKey: inboxKeys.candidates(side, jobId, params),
    queryFn: () => fetchInboxCandidates(side, jobId, params),
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
