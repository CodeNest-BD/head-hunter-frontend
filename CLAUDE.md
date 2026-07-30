# Claude Code Agent Instructions

Guidance for agents working on the **HeadHunter Frontend** — a Next.js (App Router) + React + TypeScript application.

> This repository is currently a **scaffold**: the directory structure, tooling, CI, and conventions are in place under empty (`.gitkeep`) folders waiting to be built. Treat this document as the contract every new feature must follow, and let the first few features you build establish the reference patterns for the rest.

## Structure

```
src/
  app/                 # Next.js App Router — routes, layouts, and app/api/ handlers
  features/            # Feature modules (self-contained: UI + hooks + local state)
  components/          # App-level composed components
  shared/              # Cross-feature building blocks:
    components/  ui-components/  hooks/  store/  types/
    libs/  data/  helpers/  utils/  styles/
  lib/  utils/         # Generic helpers and client setup
  mock/                # Mock data / MSW-style fixtures
  test/utils/          # Test render helpers
```

**Stack**: Next.js / React 18 / TS 5 · Tailwind CSS (+ `tailwind-merge`, shadcn-style primitives via `components.json`) · Radix UI · Redux Toolkit + redux-saga + React-Redux · TanStack Query / Table / Virtual · React Hook Form + Zod · MSAL (Azure) + Google OAuth · Firebase (FCM) · Sentry · PostHog · Vitest.

## Commands

```bash
npm run dev                  # Next dev server
npm run build                # Production build (npm run analyze for bundle analysis)
npm run lint                 # next lint
npm run test                 # Vitest (run mode)
npm run vitest:watch         # Vitest watch mode
npx tsc --noEmit 2>&1        # Typecheck
npx prettier --write .       # Format
```

## Technical Implementation Standards

- **Modern React**: functional components and hooks only. Prioritize immutability and pure functions.
- **Strict type safety**: proper TypeScript, no `any`. Avoid `unknown` unless necessary and narrow it. **Never** use `as` to satisfy a type — construct the value so TypeScript infers it, or annotate the variable. Parse untrusted/external data with **Zod** schemas. Leverage inference and discriminated unions.
- **Logic extraction**: put complex logic in custom hooks; keep components focused on UI and event orchestration.
- **Performance**: apply `useMemo`, `useCallback`, and `React.memo` strategically — to fix measured re-renders, not reflexively.

## Iteration & Data-Structure Patterns

- **Single-pass transforms**: prefer `.flatMap()` over `.map().filter()`; use `for...of` over `Object.entries().filter().map()` when building an object from filtered entries.
- **O(1) lookups**: use `Set<T>` / `Record<string, T>` for repeated membership checks instead of `Array.includes()` / `Array.some()` on collections queried in a loop.
- **Discriminated unions over booleans**: model mutually exclusive states (modals, dialogs, async status, workflows) as discriminated unions carrying their associated data — not several boolean flags that can drift into illegal combinations.

## Software Design Philosophy (Deep Design)

- **Design deep modules**: components and hooks should expose a simple interface (props/API) while hiding significant implementation complexity.
- **Information hiding**: keep internal state machinery, side effects, and data transformations private; expose only what's essential.
- **Define errors out of existence**: shape types so illegal states are unrepresentable.
- **Reduce cognitive load**: minimize a module's surface area — a consumer shouldn't need to know its internals to use it correctly.
- **Strategic over tactical**: refactor abstractions instead of accreting special-case flags.

## State Management

- **Local first**: component state and custom hooks for feature-local concerns.
- **Server state**: TanStack Query for fetching/caching/mutations — don't duplicate server data into Redux.
- **Global client state**: Redux Toolkit (with redux-saga for side-effect orchestration) reserved for genuinely global concerns; keep slices in `shared/store`.
- **Prop drilling vs. Context**: favor prop drilling for shallow hierarchies (2–3 levels) to keep data flow explicit. Use Context only for global concerns (theme, auth, user settings) or when prop drilling forces pass-through components that violate information hiding.
- **Inversion of control**: for highly reusable components with complex logic, pass components as props (composition) rather than proliferating boolean flags — keeps the parent deep and the child simple.

## Forms & Validation

React Hook Form for form state; **Zod** for schema validation (shared with parsing of API responses). Derive TypeScript types from Zod schemas (`z.infer`) rather than declaring them twice.

## UI & Styling

Tailwind CSS for styling; compose class names with `tailwind-merge` / `cn`. Build on the Radix UI primitives and the shared `ui-components/` and `components/` rather than adding new one-off component libraries. Register any new remote image host in `next.config.js` (`images.domains`). Keep bundle impact minimal — prefer an existing dependency over a new one, and rely on `optimizePackageImports` for barrel-heavy libraries.

## Testing

Vitest (`vitest.config.ts`), with render helpers under `src/test/utils/`. Test observable behaviour, not implementation details. Prefer testing custom hooks and pure logic directly; for components, assert what the user sees and can do. Keep test data deterministic.

## Clean Code & Documentation

- **Refactor aggressively**: continuously improve readability and remove all dead code and unused imports.
- **Mnemonic identifiers**: succinct, intent-revealing names that express the "why".
- **Comments**: explain the "why" behind non-obvious logic; avoid redundant "how" comments.

## Commits

Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:` (enforced via husky + commitlint).

## Finishing (Self-Review before you call it done)

**1. Holistic audit**: verify data flows without unexpected side effects; consolidate duplicate logic and overlapping helpers; confirm every imported library is used (no ghost deps, no circular references).

**2. Refactor & consolidate**: reduce nested logic, hold functions to a single responsibility, and standardize naming, error handling, and response shapes.

**3. Verify** — run and confirm:
- `npx tsc --noEmit` (no type leakage: no `any`, no `as`).
- `npm run test` and `npm run lint`.
- `npx prettier --write .`.
- Hook rules (no conditional hooks), performance (no needless re-renders), no memory leaks (cleaned-up effects/subscriptions), no data-integrity loss, and UX best practices.

**Priority when rules conflict**: Security → Type Safety → Error Handling → Testing → Documentation → Performance.
