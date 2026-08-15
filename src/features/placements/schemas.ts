import { z } from "zod";

import { placementStatusSchema } from "@/features/billing/schemas";

export { placementStatusSchema };

export const companyPlacementSchema = z.object({
  placementId: z.string(),
  jobTitle: z.string(),
  candidateName: z.string(),
  recruiterName: z.string(),
  amountMinor: z.number(),
  status: placementStatusSchema,
  joiningDate: z.string(),
  holdExpiresAt: z.string(),
  releasedAt: z.string().nullable(),
  canDispute: z.boolean(),
  createdAt: z.string(),
});
export type CompanyPlacement = z.infer<typeof companyPlacementSchema>;

export const COMPANY_PLACEMENT_STATUS_LABELS: Record<
  z.infer<typeof placementStatusSchema>,
  string
> = {
  held: "In escrow",
  disputed: "Disputed",
  releasing: "Releasing",
  released: "Released",
  refunded: "Refunded",
};
