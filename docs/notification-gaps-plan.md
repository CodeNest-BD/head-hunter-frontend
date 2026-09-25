# Notification Gaps — Implementation Plan

Tier 2 · both repos · no migration (every notification type used below already exists in `notification_type`). Source: `docs/notification-system-gaps.md`.

## The rule every notification must follow

Each notification lands in exactly one "home", and its `data` carries the id that home keys on:

| Home         | Keyed on           | Lights                                             | Cleared by                                     |
| ------------ | ------------------ | -------------------------------------------------- | ---------------------------------------------- |
| Inbox thread | `data.candidateId` | Bell + Inbox row dot + Inbox badge                 | Opening the thread (and new: while it is open) |
| Dispute      | `data.disputeId`   | Bell + Dispute row dot + Disputes badge (new rule) | Opening the dispute                            |
| Bell only    | neither            | Bell                                               | Clicking it / mark all read                    |

Anything about a candidate goes in the Inbox home (carries `candidateId`), anything about a dispute in the Dispute home. Money and account events (payouts, verification, job expiry) are bell-only and must link somewhere.

## Phase 1 — Badge and read-state correctness (FE + BE)

1. **Disputes badge = unseen updates** (decided). BE `countActiveForUser` → count the caller's disputes with an unread `disputeId` notification (reuse `PARTICIPANT_HAS_UPDATE_SQL`). FE `DisputesBadge` comment updated; admin badge unchanged (already unread-based).
2. **B1 — open thread goes stale.** FE `useConversationRealtime`: on `MESSAGE_CREATED` / `NEGOTIATION_CHANGED` for the open thread while `document.visibilityState === "visible"`, call the thread's mark-read mutation. Same for an open dispute: its 5 s refetch already marks read (done today).
3. **Sockets refresh the bell.** FE `useUnreadRealtime` + `useConversationRealtime`: also invalidate `notificationKeys.all`.
4. **Per-job candidates table highlight.** BE: add `needsReview` (the `UNSEEN_ACTIVITY` expression) to candidate rows of the level-2 list; FE `features/inbox/schemas.ts:117-121` uses `unreadMessages > 0 || needsReview`, same as the inbox list.

## Phase 2 — Missing notifications (BE)

| #   | Event                                                                     | Recipient                                   | Type reused                                                                           | `data`                                                                                                    |
| --- | ------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| M1  | Fee auto-released after guarantee (`placement-release.service.ts`)        | Recruiter + company                         | `placement_released`                                                                  | `placementId`, `candidateId`                                                                              |
| M2  | Hire rejected in guarantee, fee refunded (`placement.service.ts`)         | Recruiter                                   | `placement_released` (refund copy)                                                    | `placementId`, `candidateId`                                                                              |
| M3  | Interview outcome `next_round` / `offer` (`interview-outcome.service.ts`) | Recruiter                                   | `candidate_status_changed`, new notifier kinds `outcome_next_round` / `outcome_offer` | `interviewId`, `candidateId`                                                                              |
| M4  | Meeting link set (`interviews.service.ts`)                                | Recruiter                                   | `interview_scheduled`, new kind `meeting_link`                                        | `interviewId`, `candidateId`                                                                              |
| M5  | Job filled on offer accept (`offers.service.ts`)                          | Recruiters with other candidates on the job | `submission_status_changed` (finally used)                                            | `jobId`, `candidateId` (theirs)                                                                           |
| M6  | Interview created                                                         | —                                           | —                                                                                     | No change: creation always proposes times, which already notify. Verify during build; note in code if so. |

All inserts enlist in the caller's transaction (`manager`), matching the existing notifiers. `applyStatus` keeps `notify:false` where the action's own notification already names the status.

## Phase 3 — Bugs (BE)

- **B2 payout:** move the `PAYOUT_SENT` insert out of the Stripe try/catch into its own guarded block; add `payoutId` (and `amountMinor`) to `data`.
- **B3 dispute messages:** `postMessage` and `adminPostMessage` save the message and its notifications in one `dataSource.transaction`.

## Phase 4 — Bell links (FE `notificationHref.ts`, small BE data additions)

| Type                                                                      | Route                                                                                |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `payout_sent`, `payout_failed`, `placement_released`, `placement_created` | `/recruiter/wallet` (recruiter), `/company/wallet` (company)                         |
| `job_expired`                                                             | `/company/jobs/:jobId`                                                               |
| `verification_approved` / `verification_rejected`                         | `/recruiter/profile` or `/company/profile`                                           |
| `submission_status_changed` (M5)                                          | `/recruiter/inbox/:candidateId`                                                      |
| `recruiter_awaiting_approval` / `company_awaiting_approval`               | BE adds `profileId` to `data`; FE → `/admin/recruiters/:id` / `/admin/companies/:id` |
| `company_followed`                                                        | Stays unlinked (no follower page exists)                                             |

## Out of scope (left as-is, noted)

- `hire_confirmation_requested`, `subscription_past_due`, `placement_created` emission: wire only if the flow exists when checked in Phase 2; otherwise they stay unused and the doc says so.
- Admin per-message fan-out coalescing.

## Verification

- Per phase: `tsc` (both repos) + the focused spec for the file touched.
- End: BE unit suite, BE prettier/eslint/typecheck, FE `tsc`/`next lint`/eslint/prettier; one read-only SQL check for new queries.
- Integration tests touching changed notifiers are updated, not run (CI runs them). `next build` not run.
- Update `docs/notification-system-gaps.md` to mark what is closed.
