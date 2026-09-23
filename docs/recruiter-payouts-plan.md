# Recruiter Payouts (Withdraw Funds) — Implementation Plan

> Status: **frontend implemented behind `ENABLE_RECRUITER_PAYOUTS` (off)** — flip together with the backend shipping §3.
> Owner: frontend (this repo) + backend (external NestJS API)
> Scope: let a verified recruiter move their released commission balance to their own bank account.
>
> Implementation notes that refine §4 below: `MIN_PAYOUT_MINOR` lives in
> `src/features/billing/schemas.ts` (replace with the fetched admin setting in
> phase B); the wallet's `availableMinor`/`pendingPayoutMinor` are optional and
> deliberately NOT defaulted — an absent figure renders as unknown and keeps
> withdrawing locked, so a lagging wallet deploy can never overstate the
> withdrawable balance; the withdraw dialog re-mints its Idempotency-Key
> whenever the amount changes (same amount retried = same key).

## 1. Where money stops today

The money lifecycle is complete up to the recruiter's internal balance, then dead-ends:

```
Company loads wallet ──► fee reserved on publish ──► held in escrow on offer-accept
        (Stripe Checkout)                (ledger: reserve → hold)
                                                       │
                              30-day guarantee (holdExpiresAt) or dispute resolution
                                                       │
                                    placement: held → releasing → released
                                                       │
                                   RecruiterWalletSummary.totalMinor  ◄── STOPS HERE
```

Facts from the codebase that shape this plan:

- `RecruiterWalletSummary` (`src/features/billing/schemas.ts`): `totalMinor`, `releasedMinor`, `earnedYtdMinor`, `inEscrowMinor`, `inDisputeMinor`, `placementsCount`, `nextReleaseAt`. There is **no available-to-withdraw figure** yet.
- The ledger enum **already contains `"payout"`** (with label "Payout") — reserved but unused.
- Stripe is backend-hosted; the frontend never touches Stripe SDKs. Every money flow follows the same shape: `POST → { url } → window.location.assign(url) → return with ?param=success|canceled → poll/invalidate react-query keys` (see `useStartTopUp`, `CheckoutResultBanner`, the 6×2.5s polling loop on `company/wallet/page.tsx`).
- **No Stripe Connect anywhere** — no connected accounts, transfers, or onboarding.
- All money is integer **minor units** end to end (`src/shared/utils/money.ts`); USD only.
- Notification `type` is a tolerant plain string — new payout events need no frontend schema change.
- Feature flags pattern exists (`src/shared/config/featureFlags.ts`, mirrored on the backend).

## 2. Recommended architecture — Stripe Connect Express + manual withdrawal

**Decision: Stripe Connect Express accounts, platform-controlled transfers, withdrawal on request.**

Why this over the alternatives:

| Option                                                     | Verdict                                                                                                                                                                                                                                                    |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Connect Express + transfer on withdrawal (chosen)**      | Matches the existing model exactly: platform DB is the source of truth for balances; Stripe only moves money when told to. Stripe handles KYC/identity, bank collection, and 1099 groundwork. The frontend reuses the redirect-and-poll pattern unchanged. |
| Auto-transfer at escrow release (no withdraw button)       | Simpler for recruiters but removes platform control (clawbacks, compliance review, dispute edge cases) and contradicts the requested UX ("how does a recruiter withdraw"). Can be layered on later as an "auto-withdraw" toggle.                           |
| Manual bank rails (collect account/routing, ACH ourselves) | Requires money-transmitter compliance, manual KYC, NACHA handling. Not viable for this team size.                                                                                                                                                          |

Two-step recruiter experience:

1. **Connect a payout method (once).** Wallet page shows a "Payout Method" card → backend creates a Connect Express account + account-link URL → full-page redirect to Stripe onboarding (identity + bank) → return to `/recruiter/wallet?connect=success` → poll account status until `verified`.
2. **Withdraw (repeatable).** "Withdraw" button on the wallet (enabled when payout method is verified and `availableMinor ≥ minimum`) → dialog: amount (default: full available), arrival estimate, confirm → `POST /v1/recruiter/payouts` → row appears in Withdrawals with status `pending → processing → paid` (or `failed`, which auto-recredits).

## 3. Backend contract (external repo — the API this frontend will consume)

### 3.1 Data

```
payout_account (1:1 recruiter)
  id, recruiterId, stripeAccountId,
  status: none | onboarding | pending_verification | verified | restricted,
  bankLast4, bankName, disabledReason, createdAt, updatedAt

payout (many per recruiter)
  id, recruiterId, amountMinor, currency,
  status: pending | processing | paid | failed | canceled,
  stripeTransferId, failureReason, createdAt, paidAt
```

Wallet summary gains two fields (additive, non-breaking):
`availableMinor` (= released − sum of non-failed payouts) and `pendingPayoutMinor`.

### 3.2 Endpoints (follow existing `/v1` + Zod-parseable envelope conventions)

```
GET  /v1/recruiter/payouts/account              → PayoutAccount (status, bankLast4, bankName, disabledReason)
POST /v1/recruiter/payouts/account/onboarding   → { url }   Stripe account-link (create account on first call);
                                                            also used to re-enter onboarding / update bank
POST /v1/recruiter/payouts                      → Payout    body { amountMinor }; Idempotency-Key header
GET  /v1/recruiter/payouts?page&limit           → Paginated<Payout>
```

Admin (phase B): `GET /v1/admin/payouts`, plus a `minPayoutMinor` setting alongside the existing min-recruiter-fee setting.

### 3.3 Backend rules (must-haves)

- **Atomicity:** withdrawal creation locks the wallet row (`SELECT … FOR UPDATE`), re-checks `availableMinor ≥ amountMinor`, inserts the `payout` row and a ledger entry (`entryType: "payout"`, `referenceType: "payout"`, `referenceId`) in one transaction, **then** calls Stripe `transfers.create` with `idempotencyKey = payout.id`. Stripe failure → mark payout `failed` and reverse the ledger entry.
- **Webhooks:** `account.updated` (Connect) → payout_account status; `transfer.reversed`, and connected-account `payout.paid` / `payout.failed` → payout status. Failed → recredit ledger entry (`release_reserve`-style compensating entry) + notification.
- **Gating:** recruiter must be `verified` (existing approval gate) AND payout account `verified`. Enforce `minPayoutMinor` (recommend $50 to start) and `amountMinor ≤ availableMinor`. Rate-limit (e.g., 5 requests/day).
- **Money never leaves the ledger implicitly:** `availableMinor` is derived, never stored as a mutable counter without the ledger backing it.
- **Notifications:** emit `payout_processing`, `payout_paid`, `payout_failed` (plain-string types — frontend tolerant by design).

## 4. Frontend implementation (this repo)

All inside `src/features/billing/` following the existing file pattern. Gate everything behind a new flag.

### 4.1 Flag

`src/shared/config/featureFlags.ts` → `export const ENABLE_RECRUITER_PAYOUTS = false;` (flip with the backend's flag, same pattern as `PHASE1_FREE`).

### 4.2 Schemas (`schemas.ts`)

```ts
export const payoutAccountSchema = z.object({
  status: z.enum([
    "none",
    "onboarding",
    "pending_verification",
    "verified",
    "restricted",
  ]),
  bankName: z.string().nullable(),
  bankLast4: z.string().nullable(),
  disabledReason: z.string().nullable(),
});

export const payoutSchema = z.object({
  id: z.string(),
  amountMinor: z.number(),
  status: z.enum(["pending", "processing", "paid", "failed", "canceled"]),
  failureReason: z.string().nullable(),
  createdAt: z.string(),
  paidAt: z.string().nullable(),
});
export const PAYOUT_STATUS_LABELS = {
  pending: "Pending",
  processing: "Processing",
  paid: "Paid",
  failed: "Failed",
  canceled: "Canceled",
} satisfies Record<Payout["status"], string>;
```

Extend `recruiterWalletSummarySchema` with `availableMinor: z.number()` and `pendingPayoutMinor: z.number()` (backend ships first; coordinate or default with `.catch()`-free additive rollout).

### 4.3 API + keys + hooks

- `api/billing.ts`: `fetchPayoutAccount`, `createPayoutOnboarding` (returns url), `createPayout(amountMinor)`, `fetchPayouts(page)` — Zod-parse every response like the existing functions.
- `keys.ts`: `payoutAccount: ["billing","payout-account"]`, `payouts: (page) => ["billing","payouts",page]`.
- `hooks/useBilling.ts`:
  - `usePayoutAccount()` — query; poll every 2.5s×6 after returning from onboarding (reuse the wallet-page polling idiom).
  - `useStartPayoutOnboarding()` — mutation → `window.location.assign(url)` (identical to `useStartTopUp`).
  - `useWithdraw()` — mutation → on success invalidate `billingKeys.all`; no redirect (in-app action, unlike checkout).
  - `usePayouts(page)` — paginated query, `placeholderData: keepPreviousData`.

### 4.4 UI (`components/` + `src/app/recruiter/wallet/page.tsx`)

- **`PayoutMethodCard`** — states:
  - `none` → "Set Up Payouts" primary button + one-line explainer ("Powered by Stripe — identity and bank details are collected securely on Stripe.")
  - `onboarding`/`pending_verification` → amber pill "Verification Pending" + "Resume Setup" button.
  - `verified` → "Bank •••• 4821 — Chase" + "Update Bank" ghost button.
  - `restricted` → red alert with `disabledReason` + "Fix On Stripe" button.
- **`WithdrawDialog`** — amount input (major units, `majorInputToMinor` at the boundary), "Withdraw All" preset, validation (`min ≤ amount ≤ availableMinor`), summary line ("Arrives in 2–3 business days · no fee"), confirm button disabled while pending (double-submit guard on top of backend idempotency).
- **`PayoutsTable`** — Withdrawals history: When / Amount / Status pill / Bank / Failure reason; mobile record-card variant; empty state "No withdrawals yet."
- **Wallet page changes:** stat strip becomes _Available To Withdraw_ (primary, with Withdraw button), _In Escrow_ (`nextReleaseAt` hint), _In Dispute_, _Earned YTD_; `CheckoutResultBanner param="connect"` for the onboarding return; "How A Commission Is Paid" gains step 4: "Withdraw — move your balance to your bank whenever you like."
- **Notifications page:** map `payout_*` types into the existing icon/category mapping (wallet icon, "Account" filter bucket).

### 4.5 Guards & errors

- Page already sits behind recruiter auth; withdraw actions additionally require `payoutAccount.status === "verified"` — the button renders disabled with the reason as hint text (never hidden, so the capability is discoverable).
- `ApiError` surfaces backend validation messages in the dialog (`messages[]` from NestJS 400s), keeping the existing `suppressGlobalErrorToast` pattern for inline handling.

### 4.6 Tests (Vitest, per repo conventions)

- Schema round-trips for the two new schemas.
- `WithdrawDialog` logic: min/max validation, disabled states, minor-unit conversion (test `majorInputToMinor` edge inputs: "", "0", "49.999", full balance).
- `PayoutMethodCard` renders correct state per account status (5 statuses).
- Hook tests for invalidation after a successful withdrawal.

## 5. Edge cases & policies (decide once, encode everywhere)

| Case                                     | Policy                                                                                                                       |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Dispute opened while a payout is pending | Disputes only exist on `held` placements (already enforced); held money is never in `availableMinor`, so no interaction.     |
| Payout fails at the bank                 | Webhook marks `failed`, compensating ledger entry restores `availableMinor`, notification sent, row shows failure reason.    |
| Double-click / retried request           | Frontend disables button while pending; backend Idempotency-Key makes retries safe.                                          |
| Account restricted after being verified  | `account.updated` flips status to `restricted`; withdraw disabled with reason; existing pending payouts continue per Stripe. |
| Minimum / maximum                        | `minPayoutMinor` ($50 suggested, admin-configurable later); max = `availableMinor`.                                          |
| Currency                                 | USD only, consistent with `formatMinor` and the whole platform.                                                              |
| Taxes (US)                               | Connect Express enables Stripe's 1099-NEC e-delivery later — phase C, no design impact now.                                  |

## 6. Phasing

- **Phase A (MVP):** backend contract §3 + frontend §4 — onboarding, withdraw, history, flag off until backend is live. _Frontend effort ≈ 2–3 days once the API exists; backend is the long pole (Connect setup, webhooks, ledger transaction)._
- **Phase B:** payout notifications wired into dashboards' "Needs Attention", admin payouts console + min-payout setting, monthly statement download (reuse the jsPDF receipt pattern).
- **Phase C:** auto-withdraw toggle ("send my balance every release"), Stripe Instant Payouts (debit-card, fee passed to recruiter), 1099 tax forms.

## 7. Open questions for the client

1. Minimum withdrawal amount — $50 OK?
2. Who eats Stripe's payout costs (standard payouts are cheap; suggest platform absorbs; instant payouts later pass fee to recruiter)?
3. Should released commissions auto-pay after N days if the recruiter never withdraws (compliance preference), or sit indefinitely?
4. Any need to support non-US recruiters soon? (Changes Connect country/currency assumptions — better to know now.)
