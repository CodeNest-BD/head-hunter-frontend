import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Imported from the keys module directly, not the conversations barrel: the
// barrel also re-exports Thread and its realtime hook, which would drag the
// conversations API client into every module that merely wants to invalidate
// its cache — this hook only needs the static key array.
import { conversationKeys } from "@/features/conversations/keys";
import {
  acceptOffer,
  counterOffer,
  createOffer,
  declineOffer,
  fetchOffer,
  fetchOffers,
  withdrawOffer,
  type CounterOfferInput,
  type CreateOfferInput,
  type OfferListParams,
} from "../api/offers";
import { offerKeys } from "../keys";

export function useOffer(id: string) {
  return useQuery({
    queryKey: offerKeys.detail(id),
    queryFn: () => fetchOffer(id),
  });
}

export function useOffers(params: OfferListParams) {
  return useQuery({
    queryKey: offerKeys.list(params),
    queryFn: () => fetchOffers(params),
  });
}

/**
 * Every offer mutation below invalidates both this feature's own keys and
 * `conversationKeys.all`: sending, countering, accepting, declining or
 * withdrawing an offer all change what the thread renders next — the same
 * reasoning `features/interviews/hooks/useInterviews.ts` applies to a
 * scheduling mutation.
 */
function useInvalidateOnOffer(): () => void {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: offerKeys.all });
    void queryClient.invalidateQueries({ queryKey: conversationKeys.all });
  };
}

export function useCreateOffer() {
  const invalidate = useInvalidateOnOffer();
  return useMutation({
    mutationFn: (input: CreateOfferInput) => createOffer(input),
    onSuccess: invalidate,
  });
}

export function useCounterOffer(offerId: string) {
  const invalidate = useInvalidateOnOffer();
  return useMutation({
    mutationFn: (input: CounterOfferInput) => counterOffer(offerId, input),
    onSuccess: invalidate,
  });
}

export function useAcceptOffer(offerId: string) {
  const invalidate = useInvalidateOnOffer();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => acceptOffer(offerId),
    onSuccess: () => {
      invalidate();
      // Accepting starts escrow: wallets and placement lists change too.
      void queryClient.invalidateQueries({ queryKey: ["billing"] });
      void queryClient.invalidateQueries({ queryKey: ["placements"] });
    },
  });
}

export function useDeclineOffer(offerId: string) {
  const invalidate = useInvalidateOnOffer();
  return useMutation({
    mutationFn: () => declineOffer(offerId),
    onSuccess: invalidate,
  });
}

export function useWithdrawOffer(offerId: string) {
  const invalidate = useInvalidateOnOffer();
  return useMutation({
    mutationFn: () => withdrawOffer(offerId),
    onSuccess: invalidate,
  });
}
