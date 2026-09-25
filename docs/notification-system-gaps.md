# Notification System Gaps

As of 2026-09-25. Audit of the backend (`head-hunter-backend`) and frontend (`head-hunter-frontend`) for the company and recruiter roles. The core negotiation flow works end to end; 3 bugs and about 15 gaps remain.

## Status (2026-09-25)

Closed by `docs/notification-gaps-plan.md` Phases 1–4: **B1, B2, B3, M1–M5** (M6 confirmed not needed), every bell link below except `company_followed`, the per-job table highlight, and sockets refreshing the bell. The Disputes badge now counts unseen updates. Still open: `hire_confirmation_requested` and `subscription_past_due` are never sent (no flow emits them yet), `placement_created` is never sent (accept already notifies via `offer_accepted`), and admin dispute-message notifications are not coalesced.

## Summary

**Already works:** offer, interview, message and submission notifications reach the party opposite whoever acted, inside the same database transaction, with no duplicates. Opening a thread clears its notifications. The bell, the Inbox badge, the Disputes badge and the inbox list refresh every 5 seconds and on window focus.

**Fixed on 2026-09-25:**

- The disputes list shows a "new" marker and sorts by latest activity.
- The counterparty is now notified when a dispute is opened.
- "Mark all read" no longer wipes the inbox's unread state.
- Bell read/unread actions refresh the inbox and disputes lists.
- An admin opening a dispute clears it from their bell.

## Bugs

| #   | Problem                                                                                                                                                                                                                                                           | Where                                                                                                | Suggested fix                                                                                            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| B1  | An open thread goes stale. A message, offer or interview update that arrives while you are reading stays unread, so the row shows "Review" and the Inbox badge counts the thread you are looking at. The thread is marked read only on mount and on window focus. | FE `features/conversations/components/Thread.tsx:157-163`, `hooks/useConversationRealtime.ts:95-135` | Call mark-read in the socket handlers for new messages and negotiation changes while the tab is visible. |
| B2  | The payout notification is sent inside the Stripe call's try block. If saving it fails, a successful transfer is reported as ambiguous. Payout notifications also carry no `payoutId`.                                                                            | BE `payouts/services/recruiter-payout.service.ts:368-372`, `:478`                                    | Notify after the try block, in its own try/catch, and add `payoutId` to its data.                        |
| B3  | Dispute messages are saved and then notified outside a transaction. If the notification insert fails, the message exists but the API returns 500, and a retry duplicates it.                                                                                      | BE `disputes/disputes.service.ts` `postMessage` and `adminPostMessage`                               | Wrap the message save and the notification insert in one transaction.                                    |

## Missing Notifications

These events happen with no notification, so the affected party only finds out by opening the page.

| #   | Event                                                 | Who should hear                              | Where                                                         | Suggested fix                                                                                               |
| --- | ----------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| M1  | Fee released automatically after the guarantee period | Recruiter, company                           | BE `placements/services/placement-release.service.ts:139-142` | Send `placement_released` with `placementId`.                                                               |
| M2  | Hire rejected inside the guarantee, fee refunded      | Recruiter                                    | BE `placements/services/placement.service.ts:233-237`         | Send a placement notification about the refund; today the recruiter only gets "was passed on".              |
| M3  | Interview outcome recorded as "offer" or "next round" | Recruiter                                    | BE `interviews/services/interview-outcome.service.ts:84-100`  | Add an `outcome_recorded` kind; only "pass" notifies today.                                                 |
| M4  | Meeting link added to an interview                    | Recruiter                                    | BE `interviews/interviews.service.ts:544-575`                 | Notify the recruiter with `interviewId` and `candidateId`.                                                  |
| M5  | Job filled after an offer is accepted                 | Other recruiters with candidates on that job | BE `offers/offers.service.ts:243`                             | Send a "job filled" notification to each.                                                                   |
| M6  | Interview created                                     | Recruiter                                    | BE `interviews/interviews.service.ts:196`                     | Fine only if creation is always followed by proposed times (which do notify). Confirm, or notify on create. |

## Defined But Never Sent

These types exist in the `NotificationType` enum (BE `notifications/entities/notification.entity.ts`) but nothing emits them. Wire them to their events or remove them from the enum and the frontend.

| Type                          | Natural trigger                                                            |
| ----------------------------- | -------------------------------------------------------------------------- |
| `submission_status_changed`   | Overlaps `candidate_status_changed`, which is already sent. Likely remove. |
| `hire_confirmation_requested` | Company asked to confirm a hire.                                           |
| `placement_created`           | Offer accepted and fee put in escrow.                                      |
| `placement_released`          | Fee released to the recruiter (see M1).                                    |
| `subscription_past_due`       | Billing webhook for a failed subscription payment.                         |

## Bell Notifications With No Link

Clicking these in the bell goes nowhere. The mapping lives in FE `features/notifications/utils/notificationHref.ts`. Candidate and dispute notifications already link correctly for both roles.

| Type                                                                | Should open                                       | Note                                                    |
| ------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------- |
| `payout_sent`                                                       | `/recruiter/wallet`                               | Returns null today (`:77`); the comment there is stale. |
| `payout_failed`                                                     | `/recruiter/wallet`                               | Not mapped at all.                                      |
| `placement_*`                                                       | `/recruiter/wallet`                               | Returns null for recruiters.                            |
| `job_expired`                                                       | `/company/jobs/:jobId`                            | `data.jobId` is already present.                        |
| `verification_approved` / `verification_rejected`                   | `/{role}/profile`                                 | Returns null.                                           |
| `company_followed`                                                  | The follower's profile                            | Carries no data to link with.                           |
| `recruiter_awaiting_approval` / `company_awaiting_approval` (admin) | `/admin/recruiters/:id` or `/admin/companies/:id` | Carries no user or profile id.                          |

## Minor Inconsistencies

- **Per-job candidates table uses an older highlight rule.** FE `features/inbox/schemas.ts:117-121` (used in `InboxCandidatesTable.tsx`) highlights company rows still `submitted` or rows with unread messages. The Inbox badge also counts unseen offer, interview and status updates, so a recruiter row with an unread offer is counted but not highlighted. Fix: expose the backend's `needsReview` on candidate rows.
- **Socket events don't refresh the bell.** FE `useUnreadRealtime.ts:30-46` never invalidates notification queries, so the bell waits for its 5-second poll. Disputes, submissions and manual status changes send no socket event at all. Fix: invalidate notification queries in the socket handlers.
- **Admins get one notification per admin per dispute message**, with no coalescing. Fine at today's volume.

**Not a bug: the company's Inbox badge is usually empty.** Both roles have the badge, and it counts unread messages plus unseen offer, interview and status updates. Notifications go to the party opposite whoever acted, and most negotiation actions are the company's, so the company is only flagged for recruiter actions: new submissions, messages, confirmed times, counter-offers, and offers accepted or declined.

## Recommended Order

1. **B1 and the missing bell links.** Small, and they decide whether users trust the indicators. About half a day.
2. **B2 and B3.** Correctness around money and duplicate messages. About half a day.
3. **M1, M2 and M3.** The gaps users will notice most: fee release, refund, interview outcome. About 1 day.
4. **Clean up the never-sent types** alongside step 3.
5. **M4, M5, M6 and the minor items** as time allows.
