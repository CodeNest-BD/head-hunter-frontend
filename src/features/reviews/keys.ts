export interface ReviewListParams {
  page?: number;
  limit?: number;
  recruiterProfileId?: string;
  jobId?: string;
}

export const reviewKeys = {
  all: ["reviews"] as const,
  list: (params: ReviewListParams) => ["reviews", "list", params] as const,
  byOffer: (offerId: string) => ["reviews", "by-offer", offerId] as const,
};
