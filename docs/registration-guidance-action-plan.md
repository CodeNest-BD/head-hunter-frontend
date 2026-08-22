# Client Feedback → Action Plan

Source: `requirements/client-feedback/registration-guidance.txt`

Scope: this covers everything in that file — sign-up (employer + recruiter), the
recruiter verification gate, the recruiter live map/portal, payouts, the employer
wallet funding rule, the inbox, interviews, offers, and payments wording.

## Read this first — reconciling the feedback with the current build

Several exact phrases the client quotes are **not in the current codebase** —
they use different wording today, or the screen was never built. That means the
feedback was written against an **older build or a demo video**. So each item
below is mapped to _what exists now_ and _what the intent requires_.

Strings the client references that do **not** exist today:
`"Offer Time Slots"`, `"Placements in Guarantee"`, `"Avg Recruiter Fee"`,
`"Did you hire Priya?"`, `"General Recruiter Fee Range"`, `"Pending Commissions"`,
`"Subscribed"`, `"Cash Out"`. Current wording is called out per item.

**Legend** — `[DONE]` already matches · `[EDIT]` small copy/UI change ·
`[BUILD]` new feature or data-model change · `[EXT]` needs an external integration ·
`[ASK]` needs the client to clarify. **Effort**: S (hours) · M (~1 day) · L (multi-day) · XL (integration + multi-day).

---

## 1. Employer / Company sign-up fields

Today's sign-up collects only: company name, first/last name, email (verified),
phone (**unverified**), password, and address. Everything else the client lists
is either collected later in the profile-edit screen or not at all.
Frontend: `src/features/auth/components/SignUpForm.tsx` + `src/features/auth/schemas.ts`.
Backend: `apps/head-hunter-backend/src/auth/dto/sign-up.dto.ts`, `.../entities/company-profile.entity.ts`.

- `[EDIT S]` **Reconfirm Password** — add a confirm-password field (frontend Zod refine only; backend needs nothing).
- `[BUILD L]` **New employer fields** — none of these exist on `CompanyProfile`: **EIN / last 4 of SSN**, **Industry**, **Year Founded**, **Number of Employees (range)**, **Revenue**. Requires: entity columns + migration, DTO + validation, and form fields.
  - `[ASK]` EIN/SSN is sensitive PII — confirm we store it (and whether it must be encrypted / used for a real KYC/business check, or just captured).
  - `[ASK]` "Number of Employees" and "Revenue" as **ranges** — provide the bucket options.
- `[EDIT M]` **Website** and **"Tell candidates what your business does" (description)** already exist on `CompanyProfile` but are only in the **post-sign-up profile edit** (`CompanyProfileForm.tsx`). Move/duplicate them into the sign-up flow.
- `[DONE]` Company Name, First/Last name, Business Email (with email OTP), Password, Company Address — already collected at sign-up.
- `[EDIT S]` **Remove any "general recruiter fee range" from employer sign-up** — it is **not** at sign-up today (good), but it _does_ live on the company profile as `commissionRangeMin/MaxMinor` (`CompanyProfileForm.tsx`). See §12 — remove it; fee is per-job only.

## 2. Recruiter sign-up fields + repeatable staffing experience

Today: first/last name, email (verified), phone (**unverified**), address/city/state/zip,
a single global `yearsExperience`, a flat `specializations[]`, and up to **3 references**
(name/company/title/phone — these are _contacts_, not firm history).
Backend entities: `recruiter-profile.entity.ts`, `recruiter-reference.entity.ts`.

- `[BUILD L]` **Repeatable "Staffing Experience" (Firm Name / Number of Years / Specialization) with "ADD+ another firm".** This is a **structural change** — the client wants N firm-history entries, each with its own years + specialization. Current model has one global `yearsExperience` and one flat specialization list, plus a _separate_ references concept.
  - Add a new child table/entity `RecruiterExperience { firmName, years, specializations[] }` (repeatable, no fixed cap of 3), migration, DTO array, and a repeatable form section with an add/remove UI.
  - Decide the fate of the existing `references` concept (contacts) — keep it separately (still useful for verification) or replace. `[ASK]`
  - `yearsExperience` (global) can be derived (max/sum) or dropped once per-firm years exist. `[ASK]`
- `[BUILD S]` **LinkedIn URL** — not collected anywhere. Add to `RecruiterProfile` (column + migration), DTO, and form (with URL validation).
- `[BUILD S]` **Country** — not collected (US-only today, ZIP-validated). Add if the client wants non-US recruiters; otherwise `[ASK]` confirm US-only.
- `[EDIT S]` **Specialization list** — client's list is Accounting, Finance, Human Resources, **Administration**, Marketing, Technology, Legal, Healthcare, Engineering, Skilled Trades, **Other (enter)**. Current curated list (`src/shared/utils/specializations.ts` / backend `RECRUITER_SPECIALIZATION_SUGGESTIONS`) is broader and **missing "Administration"**. Align the suggestion list; "Other → enter" already works (custom chip).
- `[DONE]` First/Last name, Email (OTP), Address/City/State, "Other" custom specialization entry.

## 3. Phone verification (cross-cutting — both roles) `[EXT XL]`

The client explicitly wants **phone-number authentication** for both employer and
recruiter sign-up. **It does not exist** — phone is collected as free text and never
verified (no `phoneVerified` flag, no SMS provider).

- Backend: add an SMS provider (e.g., Twilio), extend `OtpPurpose` with `PHONE_VERIFICATION`, add `phoneVerified` to `User`, and a send/verify-phone-OTP endpoint pair. Reuse the existing OTP machinery in `auth.service.ts`.
- Frontend: a phone-OTP step/component mirroring `OtpForm.tsx`.
- `[ASK]` Is phone verification **required to complete sign-up**, or a later step? And is email OTP still required too?

## 4. Recruiter verification before live-map access `[DONE]` / `[ASK]`

Client: "Before recruiters get access to the live map → need a verification process
(references, background check?)."

- `[DONE]` This already exists: recruiters sign up as `pending`, an admin reviews the profile + references, and the live map is gated behind `verificationStatus === "verified"` (`useVerificationGate` / `useIsVerifiedRecruiter`; locked map + "awaiting verification" messaging in `ExploreJobsView.tsx`).
- `[ASK / EXT]` **Background check** is the only genuinely new ask — confirm whether they want a real background-check integration (e.g., Checkr) or just the manual admin review that exists.

## 5. Recruiter live map & portal

Component: `src/features/jobs/components/ExploreJobsView.tsx` + `UsJobMap.tsx`; job cards `PublicJobCard.tsx`.

- `[EDIT S]` **Map heading/subtitle** — change to the client's copy: _"Explore Live Fee-Backed Openings. Every job on the map carries a committed recruiter fee, loaded by the employer before publishing and ready for secure payment to you. Search a specific location or pick a state to see open roles."_ (Today the map card reads "Where roles are open / Click a state or city bubble to load its roles"; the hero reads "Set Your Price…".) Note this is the **recruiter-facing** heading — the public/marketing hero is separate. `[ASK]` confirm which surface(s) get this copy.
- `[EDIT M]` **State-click fee label** — change from an **average** ("avg fee $X") to a **total** "**Fees Available: $22,500**" (sum of committed fees in that state). Frontend label in `UsJobMap.tsx`; backend `/jobs/map` currently returns `averageFeeMinor` per state/city — add a **sum/total** field so the label can show total available fees.
- `[BUILD S]` **Add a salary box to the job card** — job cards show the recruiter fee but **not salary**. `publicJobCardSchema` already carries `salaryMinMinor/salaryMaxMinor`, so add a salary range display to `PublicJobCard` (grid) and `JobRow` (table).
- `[ASK]` **"Why does 'Show All States' scroll to the job list below?"** — the client is questioning current behavior (clicking a state smooth-scrolls to results, `handleSelect` in `ExploreJobsView.tsx`). Clarify desired behavior (keep scroll, or just filter in place, or a "Show all states" reset that stays at the map).
- `[ASK]` **"Add DASHBOARD?"** — client is asking whether to add a recruiter dashboard link/tab from the map. Confirm intent.

## 6. Recruiter earnings / "Pending Commissions" & Payouts tab

Dashboard: `RecruiterDashboard.tsx`. Wallet: `RecruiterWalletPanel.tsx` (`BalanceCards`, `PlacementsTable`). Subscription: `SubscriptionPanel.tsx` (currently `PHASE1_FREE`).

- `[EDIT M]` **"Pending Commissions" — show amount earned vs "Subscribed".** Today the dashboard shows an **"In escrow"** stat (not "Pending Commissions") and subscription is not surfaced there. Relabel/add a "Pending Commissions" figure (= escrowed/held commission) and surface earned-vs-subscription state. `[ASK]` exact definition of "Pending Commissions" (held-in-escrow total? or accepted-but-not-released?).
- `[EDIT M]` **Payouts tab: replace the top "Subscription" box with "Commissions Earned" + Cash Out / Transfer button; move Subscription under Name/Profile → Subscription.** Today the wallet top shows Total / In escrow / In dispute cards (no subscription box, no cash-out). So: add a "Commissions Earned" headline card, move subscription into the profile area, and add a Cash Out / Transfer action.
- `[EXT XL]` The **Cash Out / Transfer** action needs a real **payout rail** (e.g., Stripe Connect payouts) — there is no payout-to-recruiter mechanism today (escrow only releases into an internal balance). This is the biggest hidden lift in the payouts section. `[ASK]` confirm payout provider/method.

## 7. Employer wallet & the funding rule `[BUILD L]`

Client RULE: _"Employer must have enough funds to cover the job with the **largest** fee — **not** the total of all jobs combined — and reload to cover the next-largest when a job is filled/paid."_

- **This is a real behavior change.** Today the wallet **reserves each published job's fee** (`wallet.service.ts` `reserveJobFee`; available = balance − reserved), so publishing N jobs holds the **sum** of all fees — i.e., the employer effectively must fund the _total_, which is the opposite of the client's rule.
- To match the rule, change the funding check to require only the **single largest live fee** (a "max-fee coverage" model) rather than summed reservations. This touches `wallet.service.ts` (reservation/available logic), the publish flow in `jobs.service.ts`, and the employer wallet copy in `src/app/company/wallet/page.tsx` ("How reserved fees work").
- `[ASK]` This weakens payout guarantees (two jobs could fill near-simultaneously and exceed the covered max). Confirm the client accepts that, and define what happens on fill: block new publishes until reloaded, auto-pause other jobs, etc.

## 8. Employer inbox — candidate-first `[BUILD L]`

Today the inbox is a **job → recruiter (sorted by rating) → candidate** drill-down
(`InboxJobsTable.tsx` → `InboxRecruitersTable.tsx` → submission review page).

- `[BUILD]` **Candidates should be the first thing shown**, with the recruiter minimized. Restructure the inbox to a **candidate-first** list (candidate name as the headline; recruiter shown small/secondary). This is a meaningful restructure of the three-level drill-down.
- `[EDIT S]` **Show the candidate's name (not the recruiter's) as the card title, and show salary on the card.** Salary already exists on the candidate card (`CandidateFields.tsx` "Expected salary") — carry it onto the inbox candidate card.
- `[BUILD M]` **Resume quick-view on hover.** `CandidateAttachments` exists for file preview, but there's no hover quick-view — add a hover/popover resume preview on the candidate card.
- `[DONE / EDIT S]` **Order by Top-Rated Recruiter first** — recruiter ordering by `rating_avg` already exists at the recruiter level (`submission-inbox.service.ts`); once the list is candidate-first, apply the same top-rated-recruiter ordering to the candidate list.

## 9. Interviews wording + recurring prompt `[BUILD M]`

- The **"Did you hire Priya?" UI does not exist in the frontend.** The backend has an interview-outcome enum (`OFFER` / `NEXT_ROUND` / `PASS`) and a `useRecordOutcome()` hook that is **not wired to any component**. So the outcome-recording UI needs to be **built**, using the client's wording:
  - `[EDIT/BUILD]` Prompt copy: **"What are next steps for {name}?"** (not "Did you hire {name}?") with three actions: **Make Offer**, **Schedule Next Interview**, **Pass** — mapping to the existing `OFFER / NEXT_ROUND / PASS` outcomes.
  - `[BUILD]` **Recurring 24-hour prompt**: keep asking every 24h until one of the three is chosen. No reminder mechanism exists today — needs a scheduled nudge (backend job/notification) + the persistent prompt in the thread.

## 10. Offers — offer-centric, dollar amount `[EDIT M]`

Files: `SendOfferForm.tsx`, `OfferCard.tsx`, `src/features/offers/*`.

- `[DONE]` **Enter an actual dollar amount** — `SendOfferForm` already has "Salary (USD/yr)" and the offer carries `salaryMinor`.
- `[EDIT]` **"Take out fee, change to 'offer' everywhere on this page."** `OfferCard.tsx` shows _"Recruiter's fee (fixed, not part of this negotiation)"_ — the client wants the offer screens framed around the **offer (salary)**, not the fee. Remove/relocate the fee line from the offer/negotiation UI and reword to "offer".
- `[EDIT]` **"Or send an updated offer" box** — reword the counter/update box to offer language (confirm exact copy). `[ASK]` confirm whether the fee should be fully hidden on offer screens or just de-emphasized.
- `[ASK]` "Review thoroughly" — client wants a full review pass of the offers flow; get specifics.

## 11. Payments wording `[EDIT S]` / `[ASK]`

- Client: change **"Placements in Guarantee" → "Hires in Guarantee".** That exact string isn't in the code; the wallet uses **"Placements"** as the section header and a 30-day escrow ("Commission is held while the hire settles in") as the guarantee window (`RecruiterWalletPanel.tsx`).
- `[EDIT]` Apply the **"placements → hires"** terminology across the wallet/payments UI, and add/label a **"Hires in Guarantee"** figure = placements currently in the 30-day escrow window. `[ASK]` confirm this maps to the escrow-hold count.

## 12. Remove "General Recruiter Fee Range (Public)" `[EDIT S]`

Client: _"Why is General Recruiter Fee Range (Public) there? Fee is only set during Post-a-Job. Update to show something else."_

- The public "General Recruiter Fee Range" string isn't in the code, but the **company profile** carries `commissionRangeMin/MaxMinor` (edited in `CompanyProfileForm.tsx`, stored on `CompanyProfile`). This is the vestige the client means.
- `[EDIT]` Remove the commission-range field from the company profile form and anywhere it's displayed; the recruiter fee is **per-job only** (set in `JobForm.tsx`). Optionally drop/deprecate the DB columns in a later migration. `[ASK]` what to show in its place (if anything).

---

## Open questions for the client (blockers before building)

1. **EIN / SSN** — do we truly store this, and is it for a real business/KYC check or capture-only? Any encryption/compliance requirement?
2. **Employee-count and Revenue ranges** — provide the bucket options.
3. **Phone verification** — required to finish sign-up? Which SMS provider is acceptable?
4. **Background check** — real integration (e.g., Checkr) or keep the manual admin review?
5. **Cash Out / Transfer** — which payout rail (Stripe Connect payouts, ACH…)? This is the largest lift.
6. **Funding rule change** (max single fee vs total) — accept the reduced guarantee, and define behavior when a job fills below coverage.
7. **Staffing-experience model** — keep the existing "references" (contacts) alongside the new firm-history entries, or replace them?
8. **Live-map heading & "Add Dashboard?" & "Show All States" scroll** — confirm exact copy and desired behaviors.

## Suggested build order

1. **Quick copy/UI edits** (S, no backend): reconfirm password, specialization list (+Administration), salary box on job cards, offers "fee → offer" wording, payments "placements → hires" wording, map heading copy, remove commission-range from company profile.
2. **Small data-model adds** (S–M): LinkedIn URL, employer business fields (industry/year founded/employees/revenue), move website/description into sign-up.
3. **State-click "Fees Available" total** (M): add a sum field to `/jobs/map` + relabel.
4. **Interview "next steps" UI + 24h prompt** (M): wire `useRecordOutcome`, new copy, recurring nudge.
5. **Candidate-first inbox + resume hover** (L): restructure inbox.
6. **Repeatable staffing-experience model** (L): new entity + form.
7. **Funding-rule change** (L): reservation model.
8. **Integrations** (XL, external): phone verification (SMS), Cash Out (payouts), optional background check.
