import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
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
