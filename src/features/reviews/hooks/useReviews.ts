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
      queryClient.setQueryData(reviewKeys.byOffer(review.offerId), review);
      void queryClient.invalidateQueries({ queryKey: reviewKeys.all });
      toast.success("Review saved — thanks for rating your recruiter");
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateReviewInput) => updateReview(input),
    onSuccess: (review) => {
      queryClient.setQueryData(reviewKeys.byOffer(review.offerId), review);
      void queryClient.invalidateQueries({ queryKey: reviewKeys.all });
      toast.success("Review updated");
    },
  });
}
