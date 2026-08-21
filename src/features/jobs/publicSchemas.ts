import { z } from "zod";

/**
 * Guest-facing shape for GET /public/jobs/stats — the only surviving public
 * jobs endpoint; it feeds the landing page's stats strip. Deliberately
 * tolerant (`.catch` on every field): marketing must never white-screen if
 * the API contract drifts.
 */
export const publicJobStatsSchema = z.object({
  openJobs: z.number().catch(0),
  companiesHiring: z.number().catch(0),
  averageFeeMinor: z.number().catch(0),
  statesCovered: z.number().catch(0),
});
export type PublicJobStats = z.infer<typeof publicJobStatsSchema>;
