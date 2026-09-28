# UI Design-System Refactor — Alignment With `head-hunter-design`

Reference: `/Users/sm/kheps/head-hunter-design` (`assets/hh.css` + 49 mockup pages).

**Contract.** This is a *presentation-only* refactor. No copy changes, no added or
removed UI, no behaviour changes. Every visual decision — color, font size, weight,
radius, spacing, icon, border, shadow, height — comes from the reference.

**Excluded:** the marketing home (`src/app/page.tsx` body: `Hero`, `HowItWorks`,
`Testimonial`, `StatsStrip`, `DecorativeUsMap`, `LandingCta`) and the auth pages
(`src/app/(auth)/**`, `src/features/auth/**`). The public *chrome* (`LandingNav`,
`LandingFooter`) is in scope, since the other public pages share it.

---

## 1. The reference design system

### Tokens (verbatim from `hh.css :root`)

| Group | Token | Value |
| --- | --- | --- |
| Ground | canvas / surface / surface-sub / surface-sunken | `#f2f5fa` / `#ffffff` / `#f7fafd` / `#eef3fa` |
| Ink | ink / ink-body / ink-muted / ink-faint | `#0a1738` / `#333d57` / `#64708b` / `#8b95ac` |
| Lines | line / line-strong | `#dfe7f2` / `#c9d4e6` |
| Brand | blue / blue-deep / blue-ink / tint / tint-strong / sky | `#034aef` / `#0038c8` / `#2658cf` / `#eaf1fe` / `#dbe8fd` / `#85b1f3` |
| Navy | navy / navy-2 / navy-3 / rail-ink / rail-ink-dim | `#0a1738` / `#142352` / `#1d2f66` / `#aab6d4` / `#6d7ba0` |
| Semantic | ok / warn / bad / info / violet / neutral | `#0e7a43` / `#8a5a00` / `#b3261e` / `#2658cf` / `#6b4fa8` / `#5b6577` (each with `-bg` and `-line`) |
| Elevation | sh-1 / sh-2 / sh-pop | crisp 1–2px, never diffuse |
| Radius | r-lg / r-md / r-sm / r-xs | `12px` / `10px` / `8px` / `6px` |
| Shell | topbar-h / rail-w | `56px` / `232px` |

### Type scale

One family (Inter). Body `13.5px / 1.5`. Roles: `t-page` 20/700/-0.012em ·
`t-card` 15/650 · `t-block` 14/650 · `t-body` 13.5 · `t-sub` 13 muted ·
`t-meta` 12 muted · `t-faint` 12 faint · `t-label` 11/650 uppercase 0.07em.
Numbers are `tabular-nums` everywhere (`t-num`, `t-money`).

### Density

Topbar 56px · rail 232px · buttons 36px (sm 30, lg 42) · inputs 36px ·
table header 38px · table row 44px · page padding `20px 24px 56px` ·
content cap 1560px (narrow 880px) · grid gap 12px · section rhythm 16px.

### Component recipes

`.btn` (5 variants) · `.input/.select/.textarea` · `.search` · `.seg` · `.tabs` ·
`.chip` · `.toolbar` · `.card` (+head/body/foot) · `.well` · `.stat` · `.pill`
(7 tones, leading dot) · `.refchip` · `.avatar` (4 sizes, 5 deterministic tints,
`--logo`) · `.table` + `.tablecard` + `.pager` · `.listrow` · `.attn` · `.tile`
(6 tones) · `.msg` / `.composer` / `.eventcard` / `.daysep` / `.timeline` ·
`.alert` (4 tones) · `.empty` · `.formsec` · `.savebar` · `.choice` · `.tag` ·
`.facts` · `.steps` · `.splitbar` · `.barchart` · `.plan` · public `.pubnav` /
`.pubwrap` / `.pubfoot` / `.hero-*` / `.band` / `.toc` / `.prose`.

### Shell

White 56px topbar (brand left, actions right — **no global search**, per the
locked client decision) + **white** 232px rail with a blue-tint active state and
an `inset 3px` cobalt accent bar. Navy is ink and small accents only, never a
large surface. Stat cards are uniform (no `--navy` variant is used by any page).

---

## 2. Strategy

Tokens land as CSS variables in `globals.css`; `tailwind.config.ts` exposes them
as utilities; components are rewritten with Tailwind classes that map 1:1 onto
the reference CSS. This keeps the repo's shadcn / `cn()` / `tailwind-merge`
conventions (CLAUDE.md) while hitting exact visual parity.

The shadcn HSL tokens are re-pointed at the same hexes, so every token-based
component inherits the palette without being touched.

`--radius: 0.75rem` makes the existing scale land exactly on the reference:
`rounded-lg` = 12px, `rounded-md` = 10px, `rounded-sm` = 8px; `rounded-xs` = 6px
is added.

---

## 3. Phases

### Phase 0 — Token foundation
`src/app/globals.css`, `tailwind.config.ts`. Palette, radii, shadows, font
sizes, shell metrics, base body type.

### Phase 1 — Shared primitives (highest leverage)
`controls/` — button, input, textarea, select, nativeSelect, checkbox, label,
tabs, filter-chip, popover, slider, calendar, and the composite field controls.

New primitives that encode reference recipes the app currently inlines
(consolidation, not new UI): `Pill`, `StatCard`, `Tile`, `Avatar`, `RefChip`,
`Alert`, `EmptyState`, `Segmented`, `CountChip`, `BackLink`, `PageHead`, `Well`,
`Kebab`, `Facts`, `SaveBar`, `Steps`, `ChoiceCard`, `Tag`.

`data/` — `tableStyles`, `TablePager`, `ListToolbar`, `StatusBadge`,
`TableAvatar`, `TableSkeleton`, `Columns`, `RatingStars`, `CompanyLogo`.

`layout/` — `DashboardLayout` (56px topbar, 232px rail), `PageHeader`,
`FormSection`, `Breadcrumb`, `UserMenu`, `TopBarActions`, `NavBadge`.

### Phase 2 — Public chrome
`LandingNav` → `.pubnav`, `LandingFooter` → `.pubfoot`, `LegalPage` → `.toc` +
`.prose`, `AboutPage`, `PlaceholderPage`, `PublicShell`.

### Phase 3 — Features and pages
Batched by domain, each against its reference mockup:

| Batch | App code | Reference |
| --- | --- | --- |
| Dashboards | `companies/CompanyDashboard`, `recruiters/RecruiterDashboard`, `admin/AdminOverview`, `dashboard/DashboardParts` | `dashboard-company/-recruiter/-admin.html` |
| Jobs | `jobs/*` (JobsTable, JobForm, JobDetailView, JobLivePreview, ExploreJobsView, PublicJobCard, UsJobMap chrome) | `company-jobs`, `company-job-form`, `company-job-edit`, `jobs-detail`, `explore-jobs` |
| Inbox & conversations | `inbox/*`, `conversations/*`, `interviews/*`, `candidates/*` | `company-inbox*`, `recruiter-inbox*`, `recruiter-submit-candidate`, `recruiter-submissions` |
| Billing | `billing/*` | `recruiter-wallet`, `company-wallet`, `recruiter-subscription` |
| Profiles | `companies/CompanyProfileForm`, `recruiters/RecruiterProfileForm`, `reviews/*` | `company-profile`, `recruiter-profile` |
| Admin | `admin/*` | `admin-*.html` |
| Disputes & notifications | `disputes/*`, `notifications/*` | `disputes`, `dispute-detail`, `admin-disputes*`, `notifications` |

### Phase 4 — Verify loop
Repeat until clean: `npx tsc --noEmit` · `npm run lint` · `npm run test` ·
`npx prettier --write .` · a per-page audit against the matching mockup
(palette, type scale, density, radius, icons, spacing) · fix · re-audit.

### Phase 5 — Ship
Conventional commits, push, PR.

---

## 4. Guardrails

- **No text changes.** Labels, headings, helper copy and empty-state prose stay
  byte-identical. Header capitalization already follows the CLAUDE.md Title Case
  rule and is not re-cased.
- **No feature changes.** The sidebar collapse toggle, mobile drawer, column
  pickers, filters and every existing control stay — restyled, not removed.
- **No `any`, no `as`.** Discriminated unions for variant props.
- **Icons**: the reference draws Lucide-shaped 24×24 stroke icons at 15–17px.
  The app already uses `lucide-react`; sizes and stroke weights are aligned to
  the reference rather than swapping icon sets.
