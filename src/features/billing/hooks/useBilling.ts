import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createPayout,
  createSubscriptionCheckout,
  createSubscriptionPortal,
  createTopUpCheckout,
  fetchCompanyPlacements,
  fetchLedger,
  fetchMinRecruiterFee,
  fetchPayoutAccount,
  fetchPayouts,
  submitPayoutBank,
  submitPayoutIdentity,
  fetchRecruiterPlacements,
  fetchRecruiterPrice,
  fetchRecruiterWallet,
  fetchSubscription,
  fetchWallet,
  rejectPlacement,
} from "../api/billing";
import { billingKeys } from "../keys";

export function useWallet() {
  return useQuery({ queryKey: billingKeys.wallet, queryFn: fetchWallet });
}

export function useLedger(page: number) {
  return useQuery({
    queryKey: billingKeys.ledger(page),
    queryFn: () => fetchLedger(page),
  });
}

export function useSubscription() {
  return useQuery({
    queryKey: billingKeys.subscription,
    queryFn: fetchSubscription,
  });
}

/** The admin-configured recruiter price. Public — no session required. */
export function useRecruiterPrice() {
  return useQuery({
    queryKey: billingKeys.recruiterPrice,
    queryFn: fetchRecruiterPrice,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecruiterWallet(enabled = true) {
  return useQuery({
    queryKey: billingKeys.recruiterWallet,
    queryFn: fetchRecruiterWallet,
    enabled,
  });
}

export function useRecruiterPlacements(page: number) {
  return useQuery({
    queryKey: billingKeys.recruiterPlacements(page),
    queryFn: () => fetchRecruiterPlacements(page),
    placeholderData: keepPreviousData,
  });
}

export function useCompanyPlacements(page: number) {
  return useQuery({
    queryKey: billingKeys.companyPlacements(page),
    queryFn: () => fetchCompanyPlacements(page),
    placeholderData: keepPreviousData,
  });
}

/**
 * Rejecting a placement within its guarantee refunds the held fee and reopens
 * the job, so the wallet balance, the placements list and the job lists all move
 * — invalidate the whole billing tree plus jobs. The caller surfaces the error
 * inline (the API call suppresses the global toast).
 */
export function useRejectPlacement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (placementId: string) => rejectPlacement(placementId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: billingKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

/**
 * The checkout mutations end in a full-page redirect to Stripe, so there is
 * nothing to invalidate — the wallet/subscription refetch happens when the
 * user lands back on the page.
 */
export function useStartTopUp() {
  return useMutation({
    mutationFn: (amountMinor: number) => createTopUpCheckout(amountMinor),
    onSuccess: (url) => {
      window.location.assign(url);
    },
  });
}

export function useStartSubscriptionCheckout() {
  return useMutation({
    mutationFn: createSubscriptionCheckout,
    onSuccess: (url) => {
      window.location.assign(url);
    },
  });
}

export function useOpenSubscriptionPortal() {
  return useMutation({
    mutationFn: createSubscriptionPortal,
    onSuccess: (url) => {
      window.location.assign(url);
    },
  });
}

export function usePayoutAccount() {
  return useQuery({
    queryKey: billingKeys.payoutAccount,
    queryFn: fetchPayoutAccount,
  });
}

/**
 * The identity step of the in-app payout setup. The response is the fresh
 * account view — written straight into the cache so the dialog's stepper and
 * the card behind it advance without a refetch.
 */
export function useSubmitPayoutIdentity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitPayoutIdentity,
    onSuccess: (account) => {
      queryClient.setQueryData(billingKeys.payoutAccount, account);
    },
  });
}

/** The bank step of the in-app payout setup. Same cache handling as identity. */
export function useSubmitPayoutBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitPayoutBank,
    onSuccess: (account) => {
      queryClient.setQueryData(billingKeys.payoutAccount, account);
    },
  });
}

export function usePayouts(page: number) {
  return useQuery({
    queryKey: billingKeys.payouts(page),
    queryFn: () => fetchPayouts(page),
    placeholderData: keepPreviousData,
  });
}

/**
 * Withdraw from the released balance. Moves the available balance and adds a
 * payout row, so the whole billing tree refetches. The caller surfaces errors
 * inline (the API call suppresses the global toast) and supplies the
 * idempotency key so a resubmit after an ambiguous failure cannot double-pay.
 */
export function useWithdraw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      amountMinor,
      idempotencyKey,
    }: {
      amountMinor: number;
      idempotencyKey: string;
    }) => createPayout(amountMinor, idempotencyKey),
    // onSettled, not onSuccess: the backend's "ambiguous transfer" outcome is
    // an error response thrown AFTER the payout row was committed and the
    // balance debited — the error path must refresh the cached figures too.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
}

/** The publish floor for the job form's hint. Cached; silent on failure. */
export function useMinRecruiterFee() {
  return useQuery({
    queryKey: billingKeys.minRecruiterFee,
    queryFn: fetchMinRecruiterFee,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
