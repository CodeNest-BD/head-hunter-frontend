import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  fetchPublicJob,
  fetchPublicJobMap,
  fetchPublicJobs,
  fetchPublicJobStats,
  type PublicJobListParams,
} from "../api/publicJobs";
import { publicJobKeys } from "../keys";

export function usePublicJobs(params: PublicJobListParams) {
  return useQuery({
    queryKey: publicJobKeys.list(params),
    queryFn: () => fetchPublicJobs(params),
    // Keep the previous page on screen while the next filters/page load, so
    // the public grid never flashes empty.
    placeholderData: keepPreviousData,
  });
}

export function usePublicJob(id: string) {
  return useQuery({
    queryKey: publicJobKeys.detail(id),
    queryFn: () => fetchPublicJob(id),
  });
}

/** Marketing-page numbers: cache generously, never retry-storm, fail silent. */
export function usePublicJobStats() {
  return useQuery({
    queryKey: publicJobKeys.stats,
    queryFn: fetchPublicJobStats,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/** Public per-state/city open-role counts behind the landing map. */
export function usePublicJobMap() {
  return useQuery({
    queryKey: publicJobKeys.map,
    queryFn: fetchPublicJobMap,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
