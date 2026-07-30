# head-hunter-frontend

Next.js (App Router) boilerplate with TypeScript, Tailwind, Redux Toolkit,
React Query, and a feature-based `src` layout.

This is a **structural skeleton** derived from an existing project: the tooling,
config, and folder layout are in place, but there is no application code yet.
Directories are placeholders (`.gitkeep`); add routes under `src/app`, feature
modules under `src/features`, and shared building blocks under `src/shared`.

## Layout

```
src/
  app/            # Next.js App Router (routes, layouts, api)
  features/       # feature modules (components/hooks/api per feature)
  shared/         # cross-feature ui-components, hooks, utils, store, types
  components/     # generic components
  lib/  utils/    # helpers
public/           # static assets
k8s/              # deployment manifests
```

## Getting started

```bash
npm install
cp .env.sample .env       # fill in values
npm run dev               # http://localhost:3000
```

## Common scripts

- `npm run build` / `npm run start`
- `npm run lint`
- `npm test` — vitest
