# Component Design Guidance

The catalogue of what already exists and the rules for using it. **Read this
before building any UI.** Nearly every screen in this app is assembled from the
parts below; a new one-off is almost always a part that already exists, drifting.

Design source of truth: `/Users/sm/kheps/head-hunter-design` — `assets/hh.css`
defines the system, `pages/*.html` show it applied. Tokens live in
`src/app/globals.css` and are exposed as Tailwind utilities in
`tailwind.config.ts`.

**Inventory:** 65 shared components across 11 folders, 112 feature components,
46 routes.

---

## 1. The rule that matters most

**Look here first. If a part exists, use it. If it nearly fits, extend it.
Only build new when nothing here is close.**

Three consolidations this codebase has already had to make, because that rule
was not followed:

- `PageBanner` and `PageHeader` were the same header written twice.
- The column filter was written twice — once single-select, once multi-select —
  and the shared one had to learn multi-select so nothing was lost.
- Ten dialogs copied their panel classes around until they disagreed on radius,
  padding and width.

Extending a shared part is almost always cheaper than the reconciliation.

---

## 2. Tokens — never write a raw value

| Need                          | Use                                                               | Never                          |
| ----------------------------- | ----------------------------------------------------------------- | ------------------------------ |
| Page background               | `bg-canvas`                                                       | `bg-background`, `#f2f5fa`     |
| Card / panel                  | `bg-surface`                                                      | `bg-card`, `bg-white`          |
| Table head, hover, quiet fill | `bg-surface-sub`                                                  | `bg-muted`                     |
| Well, skeleton block          | `bg-surface-sunken`                                               | `bg-gray-100`                  |
| Heading / primary data        | `text-ink`                                                        | `text-foreground`, `text-navy` |
| Body copy                     | `text-ink-body`                                                   | `text-gray-700`                |
| Secondary, hints              | `text-ink-muted`                                                  | `text-muted-foreground`        |
| Timestamps, placeholders      | `text-ink-faint`                                                  | `text-gray-400`                |
| Divider, card border          | `border-line`                                                     | `border-border`                |
| Input, outline button         | `border-line-strong`                                              | `border-input`                 |
| Action, link                  | `blue`, `blue-deep`, `blue-ink`                                   | `primary`, `#034aef`           |
| Selected fill                 | `tint`, `tint-strong`                                             | `bg-accent`                    |
| Status                        | `ok` `warn` `bad` `info` `violet` `neutral`, each `-bg` / `-line` | raw hex                        |

**Navy is ink and small accents only — never a large surface.** The two
exceptions the reference itself makes are the subscription plan card and the
About page's one band.

**Type** — use the role, never a Tailwind default:
`text-label` 11 · `text-meta` 12 · `text-sub` 13 · `text-body` 13.5 ·
`text-block` 14 · `text-card` 15 · `text-section` 17 · `text-page` 20 ·
`text-stat` 24 · `text-display` 26. Never `text-sm` / `text-base` / `text-xl`.
Weights include `font-[450] [550] [650] [750]`. **Every number carries
`tabular-nums`**; money adds `font-[650] text-ink`.

**Radius** `rounded-lg` 12 (panels) · `rounded-md` 10 (cards) · `rounded-sm` 8
(controls) · `rounded-xs` 6 (chips, small buttons). Never `rounded-xl`.

**Elevation** `shadow-e1` (resting card) · `shadow-e2` (hover) · `shadow-pop`
(popovers, dialogs) · `shadow-rail` (inset cobalt edge) · `shadow-focus` (focus
halo). Never `shadow-md` / `shadow-lg`.

**Density** buttons and inputs 36px (`h-9`), small 30 (`h-7.5`), large 42
(`h-10.5`), icon button 34 (`size-8.5`), table head 38 (`h-9.5`), table row 44
(`h-11`), pill 21 (`h-5.25`), chip 28 (`h-7`), tag 26 (`h-6.5`). Grid gap 12
(`gap-3`), section rhythm 16 (`gap-4`), card body 16 (`p-4`).

> `cn()` from `@/shared/libs/shadCnConfig` — not bare `twMerge`. It is taught
> the custom font-size and radius scales; without that it files `text-sub` as a
> _colour_ and silently cancels `text-white`.

---

## 3. The catalogue

### Controls — `shared/ui-components/controls`

`Button` (variants `default` `secondary` `outline` `ghost` `destructive` `link`;
sizes `default` `sm` `lg` `icon`) · `Input` · `Textarea` · `Label` · `Select`
(Radix) · `NativeSelect` (forwards a ref, so `react-hook-form` registers on it)
· `Checkbox` · `Tabs` · `FilterChip` · `Card` + `CardHeader` / `CardTitle` /
`CardDescription` / `CardContent` / `CardFooter` · `Popover` · `Tooltip` · `menuStyles` (`MENU_OPTION_LIST`) ·
`Slider` · `Calendar` · `PasswordInput` · `PhoneInput` · `NumericInput` ·
`StateSelect` · `CityCombobox` · `SearchableSelect` · `DayPickerField` ·
`ChipListField` · `RichTextEditor` · `ConfirmAction` (inline) ·
`ConfirmActionDialog` (modal).

`destructive` is a **red-on-white outline**, not a red fill — that is what the
reference specifies.

### Badges — `shared/ui-components/badges`

`Pill` (7 tones, leading dot, `plain` drops it) · `Avatar` (sm/md/lg/xl,
deterministic tint from the name, `variant="logo"`, `round`) · `CountChip` ·
`RefChip` (inline reference to another entity) · `Tag` (selectable spec chip).

### Data — `shared/ui-components/data`

`ColumnFilter` + `FilterableHead` · `MobileFilters` · `ListToolbar` ·
`ColumnsToggle` + `useVisibleColumns` · `TablePager` · `TableSkeleton` ·
`StatusBadge` · `NegotiationStateBadges` · `RatingStars` · `TableAvatar` ·
`CompanyLogo` · `RecruiterPhoto` · `RichTextView` · `tableStyles` (the
`TABLE_*` class constants).

### Feedback — `shared/ui-components/feedback`

`Alert` (info/warn/bad/ok) · `EmptyState` · `ErrorRetryCallout` ·
`BrandLoader` (full-page wait) · `FilePreviewDialog` · `GlobalProgressBar` ·
`dialogStyles` (the `DIALOG_*` constants).

### Layout — `shared/ui-components/layout`

`DashboardLayout` · `TwoColumnDetailLayout` · `FormSection` · `Breadcrumb` ·
`Logo` · `UserMenu` · `TopBarActions` · `CurrentUserAvatar` · `CountBadge` ·
`NavBadge` · `InboxBadge` · `DisputesBadge`.

### Dashboard / list / brand / media / mobile

`StatCard` · `StatValueSkeleton` · `Panel` · `PanelGroup` · `AttentionRow` ·
`ListRow` · `Tile` · `PageHeader` · `BackLink` · `ImageUploader` ·
`ImageCropDialog` · `MobileRecordCard` + `MobileRecordList`.

---

## 4. Recipes — assemble, don't invent

### A table page

```
PageHeader → stat strip (grid gap-3) → Alert (if any) → toolbar
→ TABLE_CARD > TABLE_SCROLL > table > TablePager
```

- Toolbar: `ListToolbar` (search) with `ColumnsToggle` pushed right
  (`sm:ml-auto`).
- **Filtering lives in the column header** — `FilterableHead` + `ColumnFilter`,
  on every column whose endpoint has a param. Never a select in the toolbar.
- **Every table gets `ColumnsToggle`.** Mark `required` the identity column and
  whichever column holds the row's only action.
- A guarded `<th>` needs its `<td>` guarded identically, or every column right
  of it shifts.
- **Filters must stay reachable**: the empty state offers "Reset filters", and
  `MobileFilters` carries them below `sm`, where there is no header row.
- Rows: first cell `TABLE_TD_STACKED` with `TABLE_CELL_MAIN` over
  `TABLE_CELL_SUB`; money right-aligned; unread rows `TABLE_ROW_UNREAD` plus
  `TABLE_TD_RAIL` **on the first cell** — an inset shadow on a `<tr>` does not
  render reliably across browsers.

### A form page

`Card` of stacked `FormSection`s; `.field` groups (`flex flex-col gap-1.5`) of
`Label` + control + `text-meta text-ink-faint` hint or `text-meta font-medium
text-bad` error; sticky save bar at the foot.

### A dialog

`DIALOG_OVERLAY` + `DIALOG_PANEL` (or `DIALOG_PANEL_PADDED`), with
`DIALOG_HEADER` / `DIALOG_BODY` / `DIALOG_FOOTER` and `DIALOG_TITLE`. Add only
a `max-w-*` of your own.

### An option list

A dropdown you pick a **value** from — a column filter, a select, a searchable
picker, the Columns list — puts `MENU_OPTION_LIST` on its list container: a
hairline between rows, so a stack of same-weight labels can be scanned.

A menu of **destinations or actions** — an account menu, a row kebab, a nav
dropdown — does not. Those carry an icon per row, which already separates them,
and hairlines make them read as a table rather than a menu.

It goes on the container, not the rows, so it draws only _between_ options and
no `last:` rule can mis-fire on a wrapped row. The container's `p-1` insets the
rules from the panel border.

### A status

Name a **`PillTone`**, never a colour. Tone maps live in each feature's
`statusStyles` / `statusTones`. Green→`ok`, amber→`warn`, red→`bad`,
blue→`info`, violet→`offered`, grey→`neutral`.

---

## 5. Loading

- **Skeleton** where the shape is known — tables, stat strips, cards, detail
  panels, form sections. It must trace the real layout, or the page jumps when
  data lands.
- **Spinner** where it is not — a button mid-mutation, a popover fetching on
  open, an inline retry.
- **`BrandLoader`** where the whole app is waiting — booting a session,
  resolving a route.
- Never `return null` while pending, and never a block pulsing white-on-white.

---

## 6. Motion

Motion should say something. Stat cards lift on hover; one that links lifts
further and draws its border, so the movement marks what is clickable.

- 150–200ms, `ease-out`, on `transform` / `box-shadow` / `background-color`.
  Never animate layout properties.
- **Always pair with `motion-reduce:`** — `motion-reduce:transform-none` or
  `motion-reduce:animate-none`. The global `prefers-reduced-motion` rule covers
  CSS animations, not Tailwind transforms.
- No motion on anything a reader is trying to read: table rows, list rows, body
  copy.

---

## 7. Before you open a PR

- [ ] Nothing here already does this
- [ ] No raw hex, no `text-sm`/`text-base`, no `shadow-md`, no `rounded-xl`
- [ ] Numbers are `tabular-nums`
- [ ] Every table has `ColumnsToggle`, column filters, and a reachable reset
- [ ] Loading state is the right one of skeleton / spinner / `BrandLoader`
- [ ] A value picker carries `MENU_OPTION_LIST`; a menu of destinations or
      actions does not
- [ ] Motion is paired with `motion-reduce:`
- [ ] Interactive elements have an accessible name; icon-only ones have
      `aria-label`
- [ ] `npx tsc --noEmit`, `npm run lint`, `npm run test`, `npx prettier --write .`
