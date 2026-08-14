import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";

import {
  createSubscriptionCheckout,
  createSubscriptionPortal,
  createTopUpCheckout,
  fetchLedger,
  fetchRecruiterPlacements,
  fetchRecruiterPrice,
  fetchRecruiterWallet,
  fetchSubscription,
  fetchWallet,
  type PlacementsParams,
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

export function useRecruiterWallet() {
  return useQuery({
    queryKey: billingKeys.recruiterWallet,
    queryFn: fetchRecruiterWallet,
  });
}

export function useRecruiterPlacements(params: PlacementsParams) {
  return useQuery({
    queryKey: billingKeys.recruiterPlacements(params),
    queryFn: () => fetchRecruiterPlacements(params),
    placeholderData: keepPreviousData,
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
