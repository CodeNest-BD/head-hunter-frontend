/**
 * Phase flags. Single revert point for the recruiter subscription: flip
 * PHASE1_FREE to false to restore the paywall UI (the components and hooks
 * behind it are kept, not deleted — see also SubscriptionGuard.PHASE1_FREE on
 * the backend, which must flip together with this).
 */
export const PHASE1_FREE = true;
