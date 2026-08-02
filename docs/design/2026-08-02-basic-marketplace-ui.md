# Basic Marketplace UI — Design

**Date:** 2026-08-02
**Status:** Approved
**Depends on:** `head-hunter-backend/docs/design/2026-08-02-company-profiles-follows-notifications.md` — every endpoint below must exist before this is built.

## Goal

A deliberately plain UI covering one end-to-end loop: a company edits its profile and
publishes a job; a recruiter follows that company and is notified.

Login, signup, OTP verification and Google sign-in **already work** and are not
touched.

## Scope

**In scope** — six routes, plain forms, no layout or visual design work beyond the
conventions the existing auth pages set.

**Out of scope**

- The job intake questionnaire from the SOW mockup (benefits matrix, qualifications,
  interview-process builder). `intake` stays null; core job fields only.
- Logo upload. The backend column exists; no file picker here.
- The job map, submissions, candidates, interviews, offers — later slices.
- Any redesign of the existing auth screens.

## What already exists

The frontend is not a blank scaffold. Reuse, do not rebuild:

- `shared/libs/apiClient.ts` — axios instance with a Bearer interceptor, a
  single-flight 401→refresh retry, and a global error toast that a caller can opt out
  of with `suppressGlobalErrorToast`.
- `features/auth/` — the full session lifecycle. `useAuth()` exposes `user`, `status`
  (`booting | authenticated | unauthenticated`) and `logout`.
- `AuthProvider` already gates authenticated routes and handles the booting frame.
- Zod is the established parse boundary: every `features/auth/api/*` function parses
  its response before returning. New API modules follow that exactly.

## Routes

| Route | Role | Contents |
|---|---|---|
| `/dashboard` | any | **Exists.** Becomes role-aware links to the routes below. |
| `/company/profile` | company | One form: name, website, description, commission range min/max. Loads current values, saves with `PATCH`. |
| `/company/jobs` | company | Table of own jobs (title, status, fee) and a "New job" link. |
| `/company/jobs/new` | company | Core job fields. Saves as draft. |
| `/company/jobs/[id]` | company | Same form pre-filled, plus **Publish**. |
| `/companies` | recruiter | Company list, each row with Follow / Unfollow. |
| `/notifications` | recruiter | Notification list, unread styled, mark-as-read. |

Publish is the point of the whole slice — it is what fires the fan-out that makes
`/notifications` show anything.

## Structure

Mirrors the existing `features/auth/` layout. Three new feature modules:

```
src/features/
  companies/
    api/{companyProfiles,follows}.ts     Zod-parsed calls
    components/{CompanyProfileForm,CompanyList,FollowButton}.tsx
    hooks/{useCompanyProfile,useCompanies,useFollow}.ts
    schemas.ts
  jobs/
    api/jobs.ts
    components/{JobForm,JobsTable,PublishButton}.tsx
    hooks/{useJobs,useJob,useJobMutations}.ts
    schemas.ts
  notifications/
    api/notifications.ts
    components/NotificationList.tsx
    hooks/useNotifications.ts
    schemas.ts
```

Routes under `src/app/` stay thin — they compose feature components and nothing else,
the way `app/(auth)/login/page.tsx` does today.

## Data layer

**TanStack Query for all server state.** Nothing from these endpoints goes into
Redux; Redux stays auth-only, per the repo's CLAUDE.md.

Query keys are namespaced tuples so invalidation is precise:
`['companies', filters]`, `['company-profile', 'me']`, `['jobs', filters]`,
`['job', id]`, `['notifications', filters]`.

Mutations invalidate rather than hand-patch the cache — simpler, and correctness
matters more than a saved round-trip here. Following a company invalidates
`['companies']` so `isFollowedByMe` re-reads.

**Every response is parsed with Zod at the API boundary.** A shared
`paginatedSchema(item)` helper wraps `{ data, meta }` once instead of redeclaring it
per endpoint. Types come from `z.infer`, never hand-declared alongside a schema.

**Money is minor units.** The API speaks integer cents (`recruiterFeeMinor`,
`commissionRangeMinMinor`). The UI must never show cents to a user or send dollars to
the API, so `shared/utils/money.ts` provides `minorToMajor` / `majorToMinor`, used at
the form boundary only. Getting this wrong is a 100× error in a money field, so it is
a single tested helper rather than inline arithmetic.

## Role-based access

`AuthProvider` handles authenticated-vs-not. Role is a separate concern: a recruiter
reaching `/company/jobs/new` should not see a company form.

A `RequireRole` component wraps the role-specific routes — it reads `user.role` from
`useAuth()`, renders children on match, and redirects to `/dashboard` otherwise. This
is UX, not security; the backend enforces `@Roles` regardless, and the UI guard only
prevents a confusing screen.

## Forms

React Hook Form + Zod resolvers, as CLAUDE.md prescribes. The Zod schema is the single
source of truth: it validates the form and derives the TypeScript type.

Validation mirrors the backend DTOs so users get errors before a round-trip — required
title, two-letter state, non-negative fee, `max >= min` on the commission range. The
backend still validates; the client copy exists for feedback speed, not trust.

## Components

Install only what these screens use, into `src/shared/ui-components/`:
`button`, `input`, `label`, `textarea`, `select`, `card`. `components.json` and Radix
are already dependencies, so this is the configured-but-unused path rather than a new
one. No broad component sweep.

## States

Every list and form handles three states explicitly, because a half-handled loading
state is the most common way a basic UI feels broken:

- **Loading** — a simple skeleton or "Loading…"; never a blank screen.
- **Empty** — an actual sentence and, where useful, the action that fixes it
  ("No jobs yet. Create one.").
- **Error** — `apiClient` already toasts globally; list views additionally render an
  inline retry rather than showing a permanently empty list.

Mutations disable their submit button while in flight so a double-click cannot create
two jobs.

## Testing

Vitest with the helpers in `src/test/utils/`. Behaviour, not implementation:

- `money.ts` conversions round-trip, including a value with cents.
- Job and company form schemas reject what the backend would reject (empty title,
  negative fee, inverted commission range).
- `RequireRole` renders children for a matching role and redirects otherwise.

Component tests are kept to what the user can see and do. No snapshot tests.

## Delivery phases

One commit per phase.

1. **Foundations** — shadcn primitives, `money.ts` + tests, `paginatedSchema`,
   `RequireRole`, role-aware `/dashboard`.
2. **Company profile** — `/company/profile` read + edit.
3. **Jobs** — `/company/jobs`, `/company/jobs/new`, `/company/jobs/[id]` with publish.
4. **Follows and notifications** — `/companies`, `/notifications`.

## Verification

`npx tsc --noEmit` (no `any`, no `as`), `npm run test`, `npm run lint`,
`npx prettier --write .`. Manual pass of the full loop against a locally running
backend: company edits profile → creates job → publishes; recruiter follows that
company → sees the notification.

## Open risks

- **`NEXT_PUBLIC_API_URL` must point at the backend** or `apiClient` throws at import
  time by design. Local default is the backend on `:8080`.
- **The loop needs two accounts** (one company, one recruiter) and a verified email
  each. `SMTP_USER`/`SMTP_PASSWORD` are currently blank in the backend `.env`, which
  makes OTP verification unfinishable — the OTP is hashed before storage, so email is
  the only place it exists in plaintext. Verifying a test user may require setting
  SMTP or flipping `email_verified` directly in the database.
- **Recruiters cannot see jobs without an active subscription.** `SubscriptionGuard`
  gates the job endpoints, and no subscribe flow exists yet. This slice avoids the
  problem — recruiters browse *companies*, which is deliberately unpaywalled — but a
  recruiter clicking through to a job list will get 403 until the payments PR lands.
