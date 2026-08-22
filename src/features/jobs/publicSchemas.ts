import { z } from "zod";

/**
 * Guest-facing job shapes for /public/jobs*.
 *
 * Deliberately tolerant (`.catch` on every non-identity field): these feed the
 * public landing and explore pages, which must degrade gracefully — never
 * white-screen — if the API contract drifts.
 */
export const publicJobCardSchema = z.object({
  id: z.string(),
  title: z.string().catch(""),
  companyName: z.string().catch(""),
  roleCategory: z.string().catch("other"),
  employmentType: z.string().nullable().catch(null),
  locationState: z.string().nullable().catch(null),
  locationCity: z.string().nullable().catch(null),
  isRemote: z.boolean().catch(false),
  salaryMinMinor: z.number().nullable().catch(null),
  salaryMaxMinor: z.number().nullable().catch(null),
  recruiterFeeMinor: z.number().catch(0),
  publishedAt: z.coerce.date().nullable().catch(null),
});
export type PublicJobCard = z.infer<typeof publicJobCardSchema>;

export const publicJobDetailSchema = publicJobCardSchema.extend({
  description: z.string().nullable().catch(null),
  expiresAt: z.coerce.date().nullable().catch(null),
});
export type PublicJobDetail = z.infer<typeof publicJobDetailSchema>;

export const publicJobStatsSchema = z.object({
  openJobs: z.number().catch(0),
  companiesHiring: z.number().catch(0),
  averageFeeMinor: z.number().catch(0),
  statesCovered: z.number().catch(0),
});
export type PublicJobStats = z.infer<typeof publicJobStatsSchema>;

/** One bubble on the public landing map — open-role counts per state/city. */
export const publicJobMapEntrySchema = z.object({
  locationState: z.string().catch(""),
  locationCity: z.string().nullable().catch(null),
  openRoles: z.number().catch(0),
  averageFeeMinor: z.number().catch(0),
});
export type PublicJobMapEntry = z.infer<typeof publicJobMapEntrySchema>;
