import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createReview,
  fetchReviewByOffer,
  fetchReviews,
  updateReview,
  type CreateReviewInput,
  type UpdateReviewInput,
} from "../api/reviews";
import { reviewKeys, type ReviewListParams } from "../keys";
import type { Review } from "../schemas";

export function useReviews(params: ReviewListParams) {
  return useQuery({
    queryKey: reviewKeys.list(params),
    queryFn: () => fetchReviews(params),
    placeholderData: keepPreviousData,
  });
}

/** The company's own review of a hire; `null` = not reviewed yet. */
export function useReviewByOffer(offerId: string, enabled = true) {
  return useQuery({
    queryKey: reviewKeys.byOffer(offerId),
    queryFn: () => fetchReviewByOffer(offerId),
    enabled,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReviewInput) => createReview(input),
    onSuccess: (review) => {
      applyReviewSideEffects(queryClient, review);
      toast.success("Review saved — thanks for rating your recruiter");
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateReviewInput) => updateReview(input),
    onSuccess: (review) => {
      applyReviewSideEffects(queryClient, review);
      toast.success("Review updated");
    },
  });
}

/**
 * A review changes the recruiter's cached rating, which the backend
 * denormalizes onto the inbox recruiter rows and the admin directory. Refresh
 * all three read models — not just the reviews list — so the "sorted by
 * rating" inbox and the star columns don't go stale. The just-written review
 * is kept via setQueryData, and the reviews-list (not the whole `reviews`
 * root) is invalidated so that optimistic value isn't immediately refetched.
 */
function applyReviewSideEffects(
  queryClient: ReturnType<typeof useQueryClient>,
  review: Review,
): void {
  queryClient.setQueryData(reviewKeys.byOffer(review.offerId), review);
  void queryClient.invalidateQueries({ queryKey: [...reviewKeys.all, "list"] });
  void queryClient.invalidateQueries({ queryKey: ["submissions"] });
  void queryClient.invalidateQueries({ queryKey: ["admin"] });
}
