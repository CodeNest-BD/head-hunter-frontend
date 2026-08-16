import { HttpStatusCode, isAxiosError } from "axios";

import { apiClient } from "@/shared/libs/apiClient";
import { paginatedSchema, type Paginated } from "@/shared/libs/pagination";

import { reviewSchema, type Review } from "../schemas";
import type { ReviewListParams } from "../keys";

export interface CreateReviewInput {
  offerId: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewInput {
  id: string;
  rating?: number;
  comment?: string;
}

/** POST /v1/reviews */
export async function createReview(input: CreateReviewInput): Promise<Review> {
  const { data } = await apiClient.post<unknown>("/reviews", input);
  return reviewSchema.parse(data);
}

/** PATCH /v1/reviews/:id */
export async function updateReview(input: UpdateReviewInput): Promise<Review> {
  const { id, ...body } = input;
  const { data } = await apiClient.patch<unknown>(`/reviews/${id}`, body);
  return reviewSchema.parse(data);
}

/** GET /v1/reviews */
export async function fetchReviews(
  params: ReviewListParams,
): Promise<Paginated<Review>> {
  const { data } = await apiClient.get<unknown>("/reviews", { params });
  return paginatedSchema(reviewSchema).parse(data);
}

/**
 * GET /v1/reviews/by-offer/:offerId — the company's own review of a hire.
 * 404 means "not reviewed yet", which is data here, not an error.
 */
export async function fetchReviewByOffer(
  offerId: string,
): Promise<Review | null> {
  try {
    const { data } = await apiClient.get<unknown>(
      `/reviews/by-offer/${offerId}`,
      { suppressGlobalErrorToast: true },
    );
    return reviewSchema.parse(data);
  } catch (error) {
    if (
      isAxiosError(error) &&
      error.response?.status === HttpStatusCode.NotFound
    ) {
      return null;
    }
    throw error;
  }
}
