/**
 * Phase flags. Single revert point for the recruiter subscription: flip
 * PHASE1_FREE to false to restore the paywall UI (the components and hooks
 * behind it are kept, not deleted — see also SubscriptionGuard.PHASE1_FREE on
 * the backend, which must flip together with this).
 */
export const PHASE1_FREE = true;

/**
 * Phase-1 client delivery: hide phase-2 features from the UI without deleting
 * the code/routes behind them. Flip to `false` to reveal them all again.
 *
 * What it hides (see docs/phase-1-hidden-features.md for the full list):
 *  - Recruiter nav (sidebar + top dropdown): Companies, Inbox, Wallet
 *  - Company nav (sidebar + top dropdown): Inbox
 *  - The "Candidates" column on the company AND admin Jobs tables
 */
export const HIDE_PHASE2_FEATURES = true;
