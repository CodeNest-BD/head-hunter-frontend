# Client-Feedback Refactor — What Changed

Branch: `feat/client-refactor` (backend + frontend). Phase-1/2 scope from the
client feedback in `head-hunter-frontend/requirements/client-feedback/` and
`QA-test-reports/`.

## ⚠️ Migrations — run these manually, in order

Not auto-run. On the backend, after deploy: `npm run migration:run`. New
migrations, in order:

1. `1786610000000-AddRecruiterVerification` — verification enum + columns on
   `recruiter_profiles`; backfills active subscribers to `verified`.
2. `1786620000000-AddJobExpiry` — `expired` job status + `expires_at`;
   backfills published rows to `published_at + 30 days`.
3. `1786630000000-AddNewNotificationTypes` — `verification_approved`,
   `verification_rejected`, `job_expired`.
4. `1786640000000-CreateRecruiterReviews` — `recruiter_reviews` table +
   cached `rating_avg`/`rating_count` on `recruiter_profiles`.
5. `1786650000000-AddOtpPurpose` — `otp_purpose` enum + column on `users`;
   backfills in-flight codes to `email_verification`.

Enum `ADD VALUE` statements use `IF NOT EXISTS` and are never consumed in the
same transaction, so they are safe under TypeORM's per-migration transaction
(same pattern as the existing notification-type migrations). `down()` on the
enum migrations is a no-op — Postgres enum values are append-only.

## Backend (`head-hunter-backend`)

1. **Recruiter subscription disabled (revertible).** `SubscriptionGuard` has a
   `PHASE1_FREE` flag that passes everyone through; the paywall logic and all
   Stripe subscription plumbing are left intact as the revert path.
2. **Recruiter verification.** Sign-up → `pending`; an admin approves/rejects
   via `PATCH /admin/recruiters/:userId/verification` (status + optional note,
   notifies the recruiter in the same transaction). `VerifiedRecruiterGuard`
   gates `GET /jobs/map` and `POST /submissions`. Admin recruiter directory
   gains a verification filter and columns.
3. **30-day job expiry.** Publishing stamps `expires_at = now + 30d`. A shared
   live-listing predicate hides lapsed jobs from recruiters and guests
   immediately; an hourly, advisory-locked sweep releases the reserved fee,
   sets status `expired`, and notifies the company. Republish re-reserves and
   restarts the clock. Client-supplied `expired` status is rejected.
4. **Public endpoints** (`AuthType.None`): `GET /public/jobs`,
   `/public/jobs/stats` (throttled), `/public/jobs/:id` — card-safe fields
   only, live listings only.
5. **Minimum recruiter fee** — admin-configurable (default $500), enforced at
   publish; public `GET /billing/min-recruiter-fee`.
6. **Reviews** — company→recruiter, 1–5 stars, unlocked by a hire (accepted
   offer), one per hire (partial unique index), editable. Cached rating on the
   recruiter profile is recomputed inside each review transaction under a row
   lock. Ratings surface on recruiter summaries and the admin directory.
7. **Company inbox** — `GET /submissions/inbox/jobs` (per-job counts) and
   `GET /submissions/inbox/jobs/:jobId/recruiters` (rating-sorted, unread +
   candidate counts).
8. **QA / auth** — password recovery (`POST /auth/forgot-password`,
   `/auth/reset-password`) using an OTP purpose discriminator, anti-enumeration
   responses; `PATCH /notifications/:id/unread`.

Verification: `npm run typecheck`, `lint`, `test:unit` (238), `test:integration`
(308) — all green, including new specs for every feature above.

## Frontend (`head-hunter-frontend`)

1. **Design system** — retokenized to the client palette (primary `#034AEF`,
   ink `#0A1738`, section tint `#EEF4FD`, borders/inputs); new crosshair
   Head-Hunters logo; dashboard canvas on the blue tint; brand hex sweep.
2. **Public landing** (`/`) — rebuilt to the reference: hero + illustrative
   USA map with state bubbles, live stats strip, four-step How It Works,
   phase-1 pricing (free for recruiters), testimonial. `/temp` and the
   coming-soon page removed.
3. **Public explore-jobs** (`/explore-jobs`) — live state-bubble map for
   verified recruiters only (guests and pending recruiters get a locked
   decorative map), role/price/search filters, job-card grid, Load More.
4. **Public job details** (`/jobs/[id]`) — guests get the marketing shell +
   public data + a sign-up CTA; signed-in users keep the dashboard view;
   recruiters can submit only once verified. `/jobs` → `/explore-jobs`.
5. **Job posting** — Tiptap rich-text editor + DOMPurify-sanitized render
   (sanitized at save and render), sectioned form.
6. **Feature UI** — subscription hidden behind a `PHASE1_FREE` flag;
   verification banner + admin approve/reject; reviews (star input + dialog on
   accepted offers, shared star readout); inbox drill-down (jobs → recruiters
   → conversation); the recruiter submission table's job title links to job
   details; expiry badges + republish; min-fee admin card + form hint.
7. **QA fixes** — password show/hide toggle on login & sign-up; full
   forgot/reset-password flow; mark-a-notification-unread.

Verification: `tsc --noEmit`, `next lint`, `vitest` (240), `next build` — all
green.

## Not done / follow-ups
- Admin "expired jobs" is a status **filter** on the admin jobs page, not a
  separate tab.
- PRs are not opened yet (branches pushed only).
