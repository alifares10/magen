# Magen (מגן) — Tasks

## How to use this file

- Keep this file execution-focused.
- Use `plan.md` for architecture, scope, and product reasoning.
- Keep only the current phase fully expanded.
- Move completed work out of the hot path once a phase is done.

## Current phase

Phase 8 — overlay ingestion automation

## Current sprint goal

Add the first ingestion path for map overlays (manual refresh script or worker slice) while keeping validation green.

## Locked decisions

- App name: Magen
- Frontend: Next.js 16 + TypeScript + Tailwind + shadcn/ui + Zustand
- Validation: Zod
- Testing: Vitest + React Testing Library + ESLint
- Map stack: mapcn / MapLibre
- Backend: Supabase Postgres + Realtime
- Workers: Railway
- i18n: `next-intl` from day one
- Default locale: English
- Planned locale: Hebrew
- RTL readiness starts in Phase 1
- React Compiler enabled
- Turbopack default

## Default implementation choices

Use these unless a later task explicitly changes them.

- `live_streams.source_id`: use an internal manual source record, not nullable
- `watched_locations.user_id`: start with local-only persistence in MVP, defer real user identity/auth
- Mobile right rail: ship as a full-width section below the cards in MVP
- Official alerts and official guidance remain visually separate from news everywhere

## Phase 1 — foundation

### 1) App scaffold and tooling

- [x] Create the Next.js 16 app
- [x] Configure TypeScript, ESLint, and Prettier only if needed
- [x] Install and configure Tailwind CSS
- [x] Initialize shadcn/ui
- [x] Enable shadcn RTL support in `components.json`
- [x] Enable React Compiler in `next.config`
- [x] Verify Turbopack dev flow works cleanly

### 2) Core dependencies

- [x] Install Zustand
- [x] Install Zod
- [x] Install Vitest
- [x] Install React Testing Library
- [x] Install and set up mapcn (via `npx shadcn@latest add @mapcn/map`)
- [x] Add Noto Sans Hebrew font
- [x] Set up `next-intl` scaffolding

### 3) App structure and RTL/i18n foundation

- [x] Create the base folder structure
- [x] Configure locale-aware layout structure
- [x] Add app-level `DirectionProvider`
- [x] Wire translation keys into the app shell from day one

### 4) Testing and quality baseline

- [x] Configure test environment and test setup file
- [x] Add npm scripts for `lint`, `test`, `test:watch`, `typecheck`, and `check`
- [x] Add one smoke test for the app shell

### 5) Supabase baseline

- [x] Add local environment variables
- [x] Add Supabase client/server helpers
- [x] Create the initial database migration folder
- [x] Write the base SQL schema

### Manual / external steps

- [x] Create the Supabase project

### Phase 1 outputs

- [x] App boots locally
- [x] Tailwind + shadcn working
- [x] `next-intl` wired with translation keys
- [x] RTL-ready structure in place
- [x] Hebrew font configured
- [x] Vitest runs successfully
- [x] Lint/test/typecheck scripts exist and run
- [x] Supabase connected
- [x] Initial schema ready to apply

## Phase 2 completion (archived)

- [x] Completed schema, source seeds/activation, and migration updates for ingestion + dedupe support
- [x] Implemented RSS, official alerts, and official guidance workers with Zod validation and ingestion run logging
- [x] Wired dashboard/feed API routes and client polling for alerts/news/official updates with loading/empty/error states
- [x] Added watched-location server matching and kept watchlist persistence local-only for MVP
- [x] Added locale feed/dashboard routes, shared feed-tab logic reuse, and route-level coverage
- [x] Cleared async polling test `act(...)` warnings and re-validated `lint`, `test`, `typecheck`, and `build`

## Phase 3 completion (archived)

- [x] Build/finish dashboard header details (region/search/last-updated/source-health presentation)
- [x] Add dashboard source-health indicators (overall + per-category badges) backed by ingestion run health data
- [x] Add remaining header details for region/search presentation
- [x] Implement top ticker for breaking official updates + breaking news headlines with clear source/severity labels
- [x] Implement center panel stream integration (`/api/live-streams`) while keeping stream context secondary to official data
- [x] Complete MVP cards under the center panel (latest alert, official guidance, watched locations summary)
- [x] Finalize right-rail feed behavior and mobile placement (full-width section below cards)
- [x] Add incremental tests for each Phase 3 slice as it lands

## Phase 4 execution (completed)

- [x] Run focused dashboard UX pass for Phase 3 completion readiness (desktop/mobile + state behavior scan)
- [x] Start map structure cleanup by splitting `MapPreview` into `MapLegend`, `MapPanel`, and `CrisisMap`
- [x] Add/expand map UI tests for map rendering, center fallback logic, and watchlist summary behavior
- [x] Add map-page watchlist add/remove flow
- [x] Add watched-area prioritization cues on map and related surfaces

## Phase 5 execution (completed)

- [x] Add Supabase Realtime subscriptions for alerts, news, and official updates
- [x] Update ticker and right rail without full refresh
- [x] Show source health state and reduce noisy rerenders

## Phase 6 execution (current)

- [x] Add a locale switcher to dashboard, feed, and map headers
- [x] Preserve current route/query when switching locale and keep RTL direction switching intact
- [x] Localize client-facing fallback error rendering for feed surfaces
- [x] Add i18n key parity coverage for English/Hebrew message catalogs
- [x] Run RTL polish pass for Hebrew layouts (dashboard/feed/map), including direction-safe spacing/alignment and localized map control labels
- [x] Define notifications baseline scope (channels, trigger source, and priority behavior)
- [x] Implement initial notifications baseline in UI/data flow with official alerts as highest priority
- [x] Define initial map overlay baseline scope (shelter / road closure / hospital data sources and visual priority)
- [x] Implement the first map overlay pass with clear separation from official alert markers

## Phase 7 execution (completed)

- [x] Add Supabase migration(s) for map overlays (shelters, road closures, hospitals)
- [x] Extend source typing/seeds for overlay data ingestion ownership if needed
- [x] Add server DB reads for overlays with Zod validation and safe fallbacks
- [x] Wire map page overlays to Supabase data (keep fixture fallback only for empty/dev scenarios)
- [x] Preserve visual priority: official alerts above overlays and overlays never replace official markers
- [x] Add tests for Supabase overlay mapping/validation and map rendering with DB-backed overlay payloads
- [x] Re-run full validation: `lint`, `test`, `typecheck`, `build`
- [x] Complete Israel-only Oref relay cutover for `home-front-command-alerts` and confirm `official_alerts` runs recover from `403` failures to successful runs

### Phase 7 follow-up (optional)

- [x] Add browser Notification API opt-in as a secondary channel to in-app notifications
- [x] Add user preference controls for notification permission/state handling
- [x] Fix browser notification opt-in hydration mismatch for SSR/client initial render

## Phase 8 execution (current)

- [ ] Add first overlay ingestion path (manual seed refresh script or worker slice) so overlay data updates through ingestion flow rather than static seed-only records
- [ ] Keep full validation (`lint`, `test`, `typecheck`, `build`) green on each follow-up slice

## Open items to revisit later

- [x] Confirm exact official alert source integration details
- [x] Confirm exact official guidance source integration details
- [x] Decide whether watchlist moves from local-only persistence to Supabase in MVP or post-MVP

## Upcoming phases at a glance

### Phase 3 — MVP UI shell

- Build dashboard layout, header, ticker, center panel, and right rail
- Build alert, official update, watched locations, stream, and feed components
- Add loading, empty, and error states
- Create dashboard and feed API routes and connect the UI

### Phase 4 — map and watchlist

- Build `CrisisMap`, `MapPanel`, markers, popup, and legend
- Render alerts and watched locations on the map
- Add add/remove watchlist flow and watched-area prioritization

### Phase 5 — realtime polish

- Add Supabase Realtime subscriptions for alerts, news, and official updates
- Update ticker and right rail without full refresh
- Show source health state and reduce noisy rerenders

### Phase 6 — post-MVP backlog

- Notifications
- Shelter / road closure / hospital layers
- Locale switcher and Hebrew translations
- RTL polish
- Additional source controls
- Social signals tab

### Phase 7 — data hardening and delivery

- Replace fixture overlays with Supabase-backed overlays
- Add first ingestion path for overlay datasets (seed/manual first, worker automation next)
- Optionally add browser notification opt-in and preferences

## Definition of done for Phase 1

- [x] The app runs locally
- [x] Tailwind and shadcn are working
- [x] `next-intl` is wired in
- [x] `DirectionProvider` is in place
- [x] Hebrew font is configured
- [x] Supabase is connected
- [x] Initial schema exists in migrations
- [x] Project structure is ready for Phase 2
- [x] Lint, test, and typecheck scripts exist and run
