# Post a Job — restructure plan

Covers the structural half of the company-side client feedback. The copy, label
and validation items from the same round are already done and are not repeated
here.

Repos in scope: **head-hunter-frontend** and **head-hunter-backend** (the
benefits attachment only).

Decisions below were settled in a grill-me pass; each one records what was
chosen and what it costs.

---

## 1. Six left-labelled sections

**Asked for:** break the form into `Basics`, `Location`, `Compensation &
Benefits`, `Position Details`, `Timeline & Strategy`, with the category name and
its description on the left and the fields on the right — "similar look to the
Recruiter and Company Profile sections where they have Identity, Business
Details, Address, etc, to the left of the information boxes".

**Pattern to copy:** `CompanyFormSection` in
`src/features/companies/components/CompanyFormLayout.tsx` — the exact component
behind the Company Profile screenshot the client attached. Container
`grid gap-x-8 gap-y-4 p-5 sm:p-6 md:grid-cols-[minmax(0,15rem)_1fr]`, title
`text-sm font-bold text-navy`, hint `mt-1 text-[13px] leading-relaxed
text-muted-foreground`. Nothing is invented; `JobForm`'s `Block` component is
replaced by this one.

**Where it lives:** `CompanyFormSection` is company-feature-local but is a pure
layout primitive with no company coupling. It moves to
`src/shared/ui-components/layout/FormSection.tsx`, and both call sites import it
from there. The alternative — `JobForm` importing from `@/features/companies` —
is a feature-to-feature dependency the repo does not otherwise have.

**DECIDED — six sections, not five.** Company Info (Industry, Employee Size,
Annual Revenue, Years in Business, What You Do) is about the company, not the
role, and fits none of the client's five categories. It gets its own section
rather than being filed under a role heading. **Tell the client the rail shows
six**; they asked for five.

| #   | Section                     | Fields                                                                                                                             |
| --- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Basics**                  | Company Name (read-only), Job Title, Role Category, Employment Type, Position Open Reason, Confidential Search                     |
| 2   | **Company Info**            | Industry, Employee Size, Annual Revenue, Years in Business, What You Do                                                            |
| 3   | **Location**                | Work Model (+ on-site days), Worksite Street Address, Worksite ZIP, State, City, Days & Hours                                      |
| 4   | **Compensation & Benefits** | Pay Range + Pay Type, Benefits checkboxes, Benefits Summary (attachment + text), Recruiter Fee                                     |
| 5   | **Position Details**        | Reports To, Position Details editor, Must Haves / Nice to Haves, Top 3 Keys                                                        |
| 6   | **Timeline & Strategy**     | Availability for Interviewing, When Do You Hope to Make an Offer, Interview Rounds, Is This Position Posted Online, Other Sourcing |

Left-hand descriptions are new copy — shown before they ship.

---

## 2. Hours (Weekly) → Days & Hours

**Asked for:** replace the free-text box with day selection (Monday–Sunday, all 7) and specific hours (a dropdown of all 24 hours, AM/PM). No `Optional` label —
both are required.

**DECIDED — structured field, legacy text dropped.** The backend field becomes:

```ts
intake.daysAndHours?: {
  days: ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[];
  startHour: number; // 0–23
  endHour: number;   // 0–23
}
```

`intake` is a JSON column, so **no migration**. The old free-text values are
abandoned: a job saved before this change shows nothing for Days & Hours until
someone re-edits it. Accepted knowingly — the platform is still in its phase-1
feedback cycle, so there is little real data to lose. Changes needed in
`JobIntake` (interface), `JobIntakeDto`, and the frontend `jobIntake` mapper.

**DECIDED — one hour range for all selected days**, not per-day hours. Matches
the single "Hours (Weekly)" box in the screenshot and keeps a long form short. A
Mon–Thu 9–5 / Fri 9–1 role cannot be expressed exactly; that employer uses
Position Details.

**DECIDED — `endHour` must be after `startHour`.** Overnight shifts are
rejected. **Known limitation:** a 10 PM–6 AM warehouse or nursing role — and
Healthcare, Logistics and Skilled Trades are all in the specialization list —
cannot state its hours in a now-required field, and will describe them in
Position Details instead while this field carries a wrong-looking 6 AM–10 PM.
Revisit if the client reports it.

**Control:** `DaysAndHoursField` in `src/features/jobs/components/`, built from
day pills in the same idiom as `WorkModelControl`, plus two `Select`s of 24
options each labelled `12:00 AM` … `11:00 PM`. Validation (at least one day,
both hours, end after start) goes in the `jobFormSchema` superRefine beside the
worksite rules added this round.

---

## 3. State / City placement, and the geolocation question

**Asked for:** move State and City up level with Days & Hours, away from Work
Model.

**The client's question — "duplicated? Or required to geolocation?" — answered:
geolocation, and they are not duplicates.**

- `locationState` / `locationCity` are **columns on the job**. The job map
  (`GET /jobs/map`) groups by them and the explore filters query them; a job with
  no `locationState` is skipped by the map entirely, making it invisible on the
  marketplace's main discovery surface.
- `worksiteAddress` / `worksiteZip` live in `intake` and are **display only** —
  the street address a candidate would actually go to.

**DECIDED — no auto-derivation.** An earlier draft of this plan claimed the
ZIP → state/city data already existed here. It does not: `src/shared/data/` has
`usCitiesByState`, `usCities` and `usStatesGeo`, and `useStateCities` maps
**state → cities**. Deriving from ZIP would need a new ~40k-row dataset or a
backend lookup endpoint, and neither is worth it for this complaint.

Instead: both pairs sit together in the **Location** section, and State/City
gain a hint — _"Places this role on the live map and in recruiter search
filters."_ — so the distinction is visible on screen. The double entry stays.

---

## 4. Reports To

Moves out of the pay row into **Position Details**, directly above the editor
and its intro paragraph, as asked. Already required, and its `Optional` label is
already gone.

---

## 5. Benefits Summary → Add Attachment

**Asked for:** replace the Benefits Summary textarea with an attachment picker.

**DECIDED — one attachment, and the text box stays.** Attach a document, type a
summary, or both. This deviates from the client's literal "change from a text
box to Add Attachment" — **they will see the box still there and may re-raise
it** — but it loses nothing and removes any legacy-data question, since existing
`benefitsSummary` text keeps rendering.

**DECIDED — upload on submit, not staged.** On the new-job page there is no job
id to scope an S3 key to. (An earlier draft claimed
`job-attachments.controller.ts` already solved this; it does not — that flow
stages a _candidate_ against a job that already exists.) The chain is:

```
1. POST /jobs                          -> jobId
2. POST /jobs/:jobId/benefits-attachment/presign -> { s3Key, uploadUrl }
3. PUT file -> uploadUrl
4. PATCH /jobs/:jobId  { intake.benefitsAttachment }
```

**DECIDED — half-fail keeps the job.** If step 3 or 4 fails, the job is _not_
rolled back (unlike create-and-publish, which does delete its draft). Toast:
_"Job saved, but the benefits document didn't upload — re-attach it below."_
then route to the job's edit page, where re-attaching works against the real
job id. The job is the valuable thing; a failed PDF must not discard a long
filled-in form.

**Backend (head-hunter-backend):**

1. `POST /v1/jobs/:jobId/benefits-attachment/presign` → `{ s3Key, uploadUrl }`,
   company-scoped and restricted to the job's owner.
2. `intake.benefitsAttachment?: { s3Key, fileName, sizeBytes, contentType }` on
   `JobIntake` + `JobIntakeDto`. `benefitsSummary` stays.
3. `GET /v1/jobs/:jobId/benefits-attachment` → 302 to a short-lived signed URL,
   mirroring `recruiter-photo.controller.ts`.

**No migration** — `intake` is a JSON column. Nothing here adds a table, column,
queue or service.

**File rules:** reuse the CV constraints — `.pdf,.doc,.docx` and 10 MB, from
`CV_ACCEPT` / `CV_CONTENT_TYPES` / `MAX_CV_BYTES` in
`src/features/candidates/schemas.ts`. (The backend DTO's own ceiling is 25 MB;
the 10 MB rule is the frontend's.) These constants get a document-generic home
rather than being imported from the candidates feature.

**Frontend:** a `BenefitsAttachmentField` showing file name, size and Remove,
rendering as a download link on the job detail card beside the summary text.

---

## 6. Publish-readiness counter — a defect to fix on the way

The sticky bar's _"N fields left before you can publish"_ counts a hardcoded
list of five fields. This round made ~10 more fields required, so the bar now
says "Ready to publish" while submit fails validation.

**DECIDED — derive it from the schema** so it can never drift again:

```ts
const parsed = jobFormSchema.safeParse(values);
const remaining = parsed.success
  ? 0
  : new Set(parsed.error.issues.map((issue) => issue.path[0])).size;
```

The form already re-renders on every keystroke (`watch()`), so the parse rides
along. Days & Hours is then covered for free when it lands.

---

## 7. Required-field scope — known consequence

`JobForm` backs **create, company edit and admin edit**. The ~10 newly-required
fields therefore apply retroactively: a company fixing a typo on a live job, or
an admin editing any job, must fill Worksite Address, ZIP, City, Pay Range,
Reports To and all five Company Info fields before it will save.

**DECIDED — this stands.** One rule everywhere; old jobs get backfilled the next
time anyone touches them. Raised and reaffirmed; not to be relitigated. Revisit
only if admins report being unable to make small corrections.

---

## 8. "Is there a way to test Post a Job without loading funds?"

Yes, partly, and no code change is needed:

- **Save draft** works with an empty wallet. Only **Publish** reserves the fee,
  which is where `Insufficient funds` comes from — so the whole form, all
  validation and the live preview are testable today with no balance.
- To test publishing itself the wallet must be funded; an admin top-up against a
  test company is cheaper than a real payment.

Publish-without-funds as a testing affordance would be a backend policy change
and a separate decision.

---

## Sequencing

1. Lift `CompanyFormSection` → `shared/ui-components/layout/FormSection.tsx`.
2. Restructure `JobForm` into the six sections (items 1 and 4 — pure layout, no
   behaviour change), live preview untouched.
3. Schema-derived readiness counter (item 6).
4. `daysAndHours` structured field: backend interface + DTO, frontend mapper,
   `DaysAndHoursField`, validation (item 2).
5. State/City placement and hint (item 3).
6. Backend presign + download + intake key, then the frontend attachment field
   and the submit chain (item 5).

Steps 1–3 are one reviewable change. 4, 5 and 6 are independent after that.
Phase 2 — tests, review, comment trim, CI parity — runs once at the end of the
whole branch.
