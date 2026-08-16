import { z } from "zod";

export const reviewSchema = z.object({
  id: z.string(),
  offerId: z.string(),
  jobId: z.string(),
  jobTitle: z.string().catch(""),
  companyProfileId: z.string(),
  companyName: z.string().catch(""),
  recruiterProfileId: z.string(),
  rating: z.number(),
  comment: z.string().nullable().catch(null),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Review = z.infer<typeof reviewSchema>;
