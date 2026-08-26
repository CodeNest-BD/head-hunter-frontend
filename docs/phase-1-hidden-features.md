# Phase-1 delivery — hidden features

For the **phase-1 client delivery** we hide a set of phase-2 features from the
UI **without deleting** the code, routes, or backend behind them. Everything
here is gated by a single flag so it can be reverted in one place.

## The flag

`src/shared/config/featureFlags.ts`

```ts
export const HIDE_PHASE2_FEATURES = true; // ← flip to false to reveal everything
```

**To unhide everything after delivery:** set `HIDE_PHASE2_FEATURES = false`, then
revert the two test expectations noted below. Nothing else needs to change.

## What is hidden while the flag is `true`

### 1. Recruiter navigation — Companies, Inbox, Wallet

Hidden from **both** the sidebar and the top-right account dropdown (both read
`navForRole`). An approved recruiter then sees only **Dashboard** and
**Profile** (Explore Jobs stays in the top bar as before).

- `src/shared/ui-components/layout/dashboardNav.ts` — `HIDDEN_PHASE2_LABELS.recruiter = ["Companies", "Inbox", "Wallet"]`, filtered in `navForRole`.

### 2. Company navigation — Inbox

Hidden from the sidebar and the top dropdown. An approved company then sees
**Dashboard, Jobs, Wallet, Profile**.

- `src/shared/ui-components/layout/dashboardNav.ts` — `HIDDEN_PHASE2_LABELS.company = ["Inbox"]`.

### 3. "Candidates" column on the Jobs tables — company **and** admin

The per-job candidate count (which linked a company to its inbox and an admin to
the conversations view) is removed from both Jobs tables — the column is dropped
from the toggle list and its header/cell are gated.

- `src/features/jobs/components/JobsTable.tsx` (company) — `candidates` column entry + the two `cols.isVisible("candidates")` render guards.
- `src/features/admin/components/JobsTable.tsx` (admin) — same two spots.

### 4. "Submit candidates" button on the job detail page — disabled

The verified-recruiter CTA on `/jobs/[id]` ("Ready to submit?" card) is rendered
as a **disabled** button instead of a link to the submission workspace.

- `src/app/jobs/[id]/page.tsx` — `SubmitCandidatesButton` returns a disabled
  `<Button>` while the flag is on. Flip the flag to restore the working link.

## Tests to restore when unhiding

`src/shared/ui-components/layout/dashboardNav.test.ts` was updated to expect the
phase-1 navs. When flipping the flag back, restore:

- **recruiter approved** → `["Dashboard", "Companies", "Inbox", "Wallet", "Profile"]`
- **company approved** → contains `"Inbox"` again

## Not changed (still reachable by direct URL)

Only the **navigation entry points** and the candidate column are hidden — the
underlying pages/routes (`/recruiter/inbox`, `/company/inbox`, `/recruiter/wallet`,
`/companies`, `/admin/conversations`, …) still exist and respond if visited
directly. If phase-1 also needs those routes blocked, add guards/redirects
behind the same `HIDE_PHASE2_FEATURES` flag — call it out separately.

## Related existing flag

`PHASE1_FREE` (same file) already hides the recruiter **Subscription** paywall.
It is independent of `HIDE_PHASE2_FEATURES`.
