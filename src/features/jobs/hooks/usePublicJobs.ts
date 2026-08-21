import { useQuery } from "@tanstack/react-query";

import { fetchPublicJobStats } from "../api/publicJobs";
import { publicJobKeys } from "../keys";

/** Marketing-page numbers: cache generously, never retry-storm, fail silent. */
export function usePublicJobStats() {
  return useQuery({
    queryKey: publicJobKeys.stats,
    queryFn: fetchPublicJobStats,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
