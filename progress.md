# Progress Log

## Latest snapshot

Date:
2026-03-13
Phase:
Phase 7 complete
Current focus:
Phase 8 kickoff: add first overlay ingestion path (manual refresh script or worker slice) after completing Oref Israel relay cutover and recovery verification.

Done:

- Scaffolded Next.js 16 app with TypeScript, Tailwind v4, ESLint, Turbopack, and React Compiler.
- Initialized shadcn/ui and enabled `rtl: true` in `components.json`.
- Added core deps: Zustand, Zod, next-intl, Vitest, RTL, Supabase libs, MapLibre, Noto Sans Hebrew.
- Installed mapcn correctly via shadcn registry command (`npx shadcn@latest add @mapcn/map`).
- Implemented locale-aware app shell under `src/app/[locale]` with next-intl routing, message files, and `DirectionProvider`.
- Added localized map foundation route at `src/app/[locale]/map/page.tsx` using mapcn components.
- Migrated project code to a `src/` folder structure (`src/app`, `src/components`, `src/lib`, `src/i18n`, `src/messages`, `src/store`) and updated config paths.
- Added test baseline (`vitest.config.ts`, `test/setup.ts`) and smoke test for app shell.
- Added Supabase env template, browser/server/admin helpers, and `supabase/migrations/0001_initial_schema.sql`.
- Added `supabase/migrations/0002_seed_sources.sql` to seed official placeholder sources (inactive) plus trusted RSS sources (active) with idempotent upsert logic.
- Created Supabase project, added real env values, and pushed migrations successfully.
- Implemented first RSS ingestion worker at `workers/rss/run.ts` with per-source polling, Zod normalization, and per-run URL dedupe.
- Added `ingestion_runs` per-source lifecycle logging (`started` -> `success`/`failed`) with fetched/inserted counters and error capture.
- Added canonical URL/fingerprint dedupe helpers and unit tests for dedupe + RSS normalization.
- Added `npm run worker:rss` script and worker README docs.
- Implemented first real map data flow for `alerts` + local-only watched locations on `src/app/[locale]/map/page.tsx`.
- Added map marker schemas and alert query mapping (`src/lib/schemas/map.ts`, `src/lib/db/map-alerts.ts`) with tests.
- Added local-only persisted watchlist store (`src/store/use-watchlist-store.ts`) and dual marker rendering in map preview.
- Implemented contract-first official alerts worker at `workers/alerts/run.ts` with JSON payload extraction, Zod normalization, fallback external ID dedupe, and per-source `ingestion_runs` logging.
- Added alert insert schema + normalization tests (`src/lib/schemas/alert.ts`, `workers/alerts/normalize.ts`, `workers/alerts/normalize.test.ts`).
- Added `npm run worker:alerts` script and alerts worker README docs.
- Implemented contract-first official guidance worker at `workers/official/run.ts` with JSON payload extraction, Zod normalization, fallback external ID dedupe, and per-source `ingestion_runs` logging.
- Added official update insert schema + normalization tests (`src/lib/schemas/official-update.ts`, `workers/official/normalize.ts`, `workers/official/normalize.test.ts`).
- Added `npm run worker:official` script and official worker README docs.
- Validated successfully: `lint`, `test`, `typecheck`, `build`, `worker:official`; worker exits cleanly when guidance sources remain inactive.
- Added first dashboard/feed server data layer in `src/lib/db/feed.ts` with Zod-validated mapping for alerts, news, official updates, live streams, and overview payload.
- Added API endpoints: `src/app/api/dashboard/overview/route.ts`, `src/app/api/alerts/route.ts`, `src/app/api/news/route.ts`, `src/app/api/official-updates/route.ts`.
- Added API query param parsing helpers with tests (`src/lib/api/params.ts`, `src/lib/api/params.test.ts`) and feed mapping tests (`src/lib/db/feed.test.ts`).
- Confirmed Oref official alerts contract (`https://www.oref.org.il/WarningMessages/alert/alerts.json`) and integrated source-specific extraction in `workers/alerts/extract.ts`.
- Updated alerts worker to treat BOM/whitespace-only responses as empty snapshots, fan out Oref `data[]` into one row per location, and keep deterministic per-location external IDs.
- Added snapshot reconciliation in `workers/alerts/run.ts` so current alert IDs stay `active` and missing active IDs are marked `resolved`.
- Added tests for Oref extraction/parsing and normalization updates (`workers/alerts/extract.test.ts`, `workers/alerts/normalize.test.ts`).
- Added `supabase/migrations/0003_activate_oref_alerts_source.sql` to set Oref `feed_url` and activate `home-front-command-alerts`.
- Applied migration `0003_activate_oref_alerts_source.sql` with `supabase db push` and verified `npm run worker:alerts` runs cleanly with zero active alerts.
- Confirmed Oref official guidance contract (`https://api.oref.org.il/api/v1/home/heb`) and integrated source-specific extraction from `content[*].newsListFeatured.newsItems[]` in `workers/official/extract.ts`.
- Updated official guidance normalization to support Oref fields (`time` -> `published_at`, numeric `id` -> string `external_id`, `text` body, `featured_news` update type).
- Added official guidance extraction + normalization tests (`workers/official/extract.test.ts`, `workers/official/normalize.test.ts`).
- Added and applied `supabase/migrations/0004_activate_oref_guidance_source.sql` to activate the official guidance source using the Oref API endpoint.
- Added and applied `supabase/migrations/0005_add_full_unique_source_external_id_indexes.sql` so `onConflict: source_id,external_id` upserts work for alerts and official updates.
- Verified workers locally: `worker:official` ingested 3 guidance updates; `worker:alerts` runs cleanly with no active alerts.
- Wired dashboard shell UI to live API data in `src/components/layout/app-shell.tsx` with client-side Zod-validated fetches for `/api/dashboard/overview`, `/api/alerts`, `/api/news`, and `/api/official-updates`.
- Added per-tab feed behavior with polling defaults (`alerts`: 30s, `news`/`official`: 60s), plus loading/empty/error states and latest-updated timestamps.
- Updated home page translation wiring and locale messages for new live data labels/states (`src/app/[locale]/page.tsx`, `src/messages/en.json`, `src/messages/he.json`).
- Added API response envelope schemas for safe client parsing (`src/lib/schemas/api-responses.ts`).
- Expanded app shell tests to cover loading, successful fetch/render, tab switching, and API error fallback (`src/components/layout/app-shell.test.tsx`).
- Validated successfully: `lint`, `test`, `typecheck`, `build`.
- Added overview request schemas for watched locations (`dashboardOverviewRequestBodySchema`) and optional `watchedLocationsCount` response metadata (`src/lib/schemas/api-responses.ts`).
- Extended `src/lib/db/feed.ts` with server-side watched-location matching using Haversine distance, radius filtering, and sorted match counts (`computeWatchedLocationMatches`, `calculateDistanceInKilometers`).
- Updated `/api/dashboard/overview` route to support `POST` with validated watched locations while preserving `GET` compatibility (`src/app/api/dashboard/overview/route.ts`).
- Updated dashboard client overview fetch to send local watchlist snapshot to `POST /api/dashboard/overview` and re-fetch on watchlist changes (`src/components/layout/app-shell.tsx`).
- Added tests for watched-location matching and overview request schema validation (`src/lib/db/feed.test.ts`, `src/lib/schemas/api-responses.test.ts`), and verified watched locations are sent from the app shell (`src/components/layout/app-shell.test.tsx`).
- Validated successfully: `lint`, `test`, `typecheck`, `build`.
- Decided to keep watchlist persistence local-only for MVP and defer Supabase-backed watchlist persistence to post-MVP.
- Added localized feed page at `src/app/[locale]/feed/page.tsx`, wired to existing feed endpoints via new client component `src/components/feed/live-feed-page.tsx`.
- Kept newest alert visible outside tabs on feed page and maintained visual separation for alerts/news/official lists.
- Added feed page translations in `src/messages/en.json` and `src/messages/he.json`, and updated `/feed` redirect to `/en/feed`.
- Added feed page interaction tests (`src/components/feed/live-feed-page.test.tsx`).
- Validated successfully: `lint`, `test`, `typecheck`, `build`.
- Added shared locale dashboard wrapper component at `src/components/layout/localized-dashboard-shell.tsx` so dashboard content mapping is not duplicated.
- Updated locale home page to reuse the shared wrapper (`src/app/[locale]/page.tsx`).
- Added locale dashboard route at `src/app/[locale]/dashboard/page.tsx` and aligned root redirect `/dashboard` -> `/en/dashboard` (`src/app/dashboard/page.tsx`).
- Validated successfully: `lint`, `test`, `typecheck`, `build` (tests still report existing `act(...)` warnings in async polling tests).
- Extracted shared feed client helpers in `src/lib/feed/client.ts` (`getAlertsData`, `getNewsData`, `getOfficialUpdatesData`, `formatDateTime`, `getAlertLocation`, `TAB_FETCH_INTERVALS`).
- Added shared feed polling/state hook at `src/components/feed/use-live-feed-tabs.ts` and reused it in both `src/components/layout/app-shell.tsx` and `src/components/feed/live-feed-page.tsx`.
- Kept UI behavior and visual separation unchanged while removing duplicated feed-tab logic.
- Validated successfully: `lint`, `test`, `typecheck`, `build` (tests still report existing `act(...)` warnings in async polling tests).
- Added focused hook tests for shared feed tab behavior in `src/components/feed/use-live-feed-tabs.test.tsx`.
- Updated polling-related component tests (`src/components/layout/app-shell.test.tsx`, `src/components/feed/live-feed-page.test.tsx`) with explicit `act`-wrapped render/cleanup helpers.
- Updated `AppShell` test setup to reset the watchlist store in `beforeEach` so no async state updates run after assertions.
- Validated successfully: `test` output is now warning-free (no React Testing Library `act(...)` warnings), plus `lint`, `typecheck`, and `build` all pass.
- Added route-level navigation coverage tests in `src/app/routing.test.tsx` for `src/app/[locale]/page.tsx`, `src/app/[locale]/dashboard/page.tsx`, and `src/app/dashboard/page.tsx` redirect behavior.
- Validated successfully: `lint`, `test`, `typecheck`, `build`.
- Updated `tasks.md` housekeeping to move the project to `Phase 3 — MVP UI shell`, archive completed Phase 2 execution items, and add concrete Phase 3 execution checkboxes.
- Added source health domain schemas (`sourceHealthOverviewSchema`) and API response schema support (`sourceHealthApiResponseSchema`).
- Added server-side source health aggregation in `src/lib/db/feed.ts` from active `sources` + latest `ingestion_runs`, including freshness/staleness thresholds and overall/category status derivation.
- Added `GET /api/source-health` at `src/app/api/source-health/route.ts` and client fetch helper `getSourceHealthData` in `src/lib/feed/client.ts`.
- Updated dashboard header in `src/components/layout/app-shell.tsx` to poll/render source health (overall + official alerts/guidance/news badges) and show last refresh timestamp.
- Added source health i18n strings in `src/messages/en.json` and `src/messages/he.json`, and wired them in `src/components/layout/localized-dashboard-shell.tsx`.
- Added tests for source health derivation/schema/header rendering updates (`src/lib/db/feed.test.ts`, `src/lib/schemas/api-responses.test.ts`, `src/components/layout/app-shell.test.tsx`).
- Validated successfully: `lint`, `test`, `typecheck`, `build`.
- Added live-stream API response schema support (`liveStreamsApiResponseSchema`) and client helper (`getLiveStreamsData`) in `src/lib/schemas/api-responses.ts` and `src/lib/feed/client.ts`.
- Added `GET /api/live-streams` route at `src/app/api/live-streams/route.ts` backed by active stream DB queries.
- Added center stream panel component at `src/components/streams/stream-panel.tsx` and integrated it into `src/components/layout/app-shell.tsx` with polling, loading/empty/error states, and secondary-context labeling.
- Added stream UI i18n wiring in `src/components/layout/localized-dashboard-shell.tsx`, `src/messages/en.json`, and `src/messages/he.json`.
- Added and applied `supabase/migrations/0006_seed_initial_live_stream.sql` to seed the provided YouTube stream (`https://www.youtube.com/watch?v=gmtlJ_m2r5A`).
- Expanded tests for stream schema + dashboard rendering (`src/lib/schemas/api-responses.test.ts`, `src/components/layout/app-shell.test.tsx`).
- Validated successfully: `lint`, `test`, `typecheck`, `build`.
- Polished the top ticker in `src/components/layout/app-shell.tsx` to show prioritized official alert/guidance + breaking news cards with explicit type/source/severity tagging and horizontal scroll behavior.
- Added ticker type/breaking i18n keys in `src/messages/en.json` and `src/messages/he.json`, wired through `src/components/layout/localized-dashboard-shell.tsx`.
- Expanded dashboard test coverage for ticker rendering in `src/components/layout/app-shell.test.tsx`.
- Validated successfully: `lint`, `test`, `typecheck`, `build`.
- Finished the remaining dashboard header details in `src/components/layout/app-shell.tsx` with region selector, city/location search input, and header-level last-updated presentation.
- Added local region/search filtering across ticker, overview cards, watched locations summary, and right-rail feed tab lists while preserving official/news visual separation.
- Added header/filter translation wiring in `src/components/layout/localized-dashboard-shell.tsx`, `src/messages/en.json`, and `src/messages/he.json`.
- Expanded app shell tests for region/search filter behavior in `src/components/layout/app-shell.test.tsx`.
- Validated successfully: `lint`, `test`, `typecheck`, `build`.
- Polished center cards in `src/components/layout/app-shell.tsx` for latest alert, official guidance, and watched locations with clearer metadata grouping, ranked watchlist rows, and consistent updated/error display.
- Added alert message fallback i18n wiring in `src/components/layout/localized-dashboard-shell.tsx`, `src/messages/en.json`, and `src/messages/he.json`.
- Expanded center-card test coverage for metadata rendering, ranked watchlist display, and empty/error states in `src/components/layout/app-shell.test.tsx`.
- Validated successfully: `lint`, `test`, `typecheck`, `build`.
- Finalized right-rail mobile/desktop behavior in `src/components/layout/app-shell.tsx` by keeping the rail full-width below cards on mobile and using a fixed-height desktop feed container with internal scroll.
- Polished right-rail feed tab UX with clearer tab row layout, stable per-tab loading/error/empty behavior, and persistent updated timestamp placement.
- Added right-rail tests in `src/components/layout/app-shell.test.tsx` for official-tab empty state, tab-specific error recovery, and layout-class intent for mobile/full-width + desktop fixed-height behavior.
- Validated successfully: `lint`, `test`, `typecheck`, `build`.
- Ran a focused dashboard UX pass for Phase 3 completion readiness (desktop/mobile scanning, tabs, loading/empty/error behavior) with no blocking regressions found.
- Started Phase 4 component structure cleanup by splitting `src/components/map/map-preview.tsx` into `src/components/map/crisis-map.tsx`, `src/components/map/map-legend.tsx`, `src/components/map/map-panel.tsx`, and `src/components/map/map-summary-cards.tsx` while preserving map behavior.
- Added map UI tests in `src/components/map/map-preview.test.tsx` covering map center fallback order (alerts -> watchlist -> default), marker rendering, and watchlist/alert summary states.
- Validated successfully: `lint`, `test`, `typecheck`, `build`.
- Implemented map-page watchlist add/remove interactions via new `src/components/map/map-watchlist-manager.tsx`, wired into `src/components/map/map-preview.tsx` with local-only persisted Zustand actions.
- Added alert-derived watchlist suggestion flow (watch), current watchlist removal flow (remove), and watching-state badge behavior while preserving existing map marker/summary rendering.
- Added watchlist manager i18n keys and locale wiring in `src/app/[locale]/map/page.tsx`, `src/messages/en.json`, and `src/messages/he.json`.
- Expanded `src/components/map/map-preview.test.tsx` to cover add/remove interactions and already-watched candidate behavior.
- Validated successfully: `lint`, `test`, `typecheck`, `build`.
- Implemented watched-area prioritization logic in `src/lib/map/watch-priority.ts` and added focused ranking tests in `src/lib/map/watch-priority.test.ts`.
- Wired prioritized watch-area cues into map UI surfaces in `src/components/map/crisis-map.tsx`, `src/components/map/map-summary-cards.tsx`, `src/components/map/map-watchlist-manager.tsx`, and `src/components/map/map-preview.tsx`.
- Added new map-page i18n keys for prioritization labels in `src/messages/en.json` and `src/messages/he.json`, wired through `src/app/[locale]/map/page.tsx`.
- Expanded map UI coverage for prioritization cues in `src/components/map/map-preview.test.tsx`.
- Validated successfully: `lint`, `test`, `typecheck`, `build`.
- Added a browser Supabase client singleton in `src/lib/supabase/client.ts` to avoid duplicate realtime sockets.
- Added `src/components/feed/use-supabase-feed-realtime.ts` with Supabase Realtime subscriptions for `alerts`, `news_items`, and `official_updates` (`INSERT` + targeted `UPDATE` handling).
- Updated `src/components/feed/use-live-feed-tabs.ts` to consume realtime events with debounced silent refreshes and per-tab in-flight fetch guards.
- Updated `src/components/layout/app-shell.tsx` to debounce overview refreshes from feed realtime events so ticker + latest cards update without waiting for polling.
- Added `supabase/migrations/0007_enable_realtime_feed_tables.sql` to ensure `alerts`, `news_items`, and `official_updates` are included in the `supabase_realtime` publication.
- Expanded tests for realtime behavior in `src/components/feed/use-live-feed-tabs.test.tsx` and `src/components/layout/app-shell.test.tsx`.
- Validated successfully: `lint`, `test`, `typecheck`, `build`.
- Added `src/components/layout/use-supabase-source-health-realtime.ts` to subscribe to `sources` and `ingestion_runs` changes with filtering for monitored source types/job types and status transitions.
- Updated `src/components/layout/app-shell.tsx` to debounce source-health realtime refreshes and avoid unnecessary loading-state churn after initial data load.
- Expanded app-shell coverage for source-health realtime updates in `src/components/layout/app-shell.test.tsx`.
- Applied `supabase/migrations/0007_enable_realtime_feed_tables.sql` via `supabase db push`.
- Added and applied `supabase/migrations/0008_enable_realtime_source_health_tables.sql` so `sources` and `ingestion_runs` are also in the `supabase_realtime` publication.
- Re-validated successfully: `lint`, `test`, `typecheck`, `build`.
- Added typed next-intl navigation helpers in `src/i18n/navigation.ts` and a reusable locale switcher in `src/components/i18n/locale-switcher.tsx`.
- Integrated locale switching into dashboard/feed/map headers (`src/components/layout/app-shell.tsx`, `src/components/feed/live-feed-page.tsx`, `src/components/map/map-preview.tsx`) while preserving current path/query.
- Added locale switcher i18n keys in `src/messages/en.json` and `src/messages/he.json`, and added message key parity test coverage in `src/messages/messages.test.ts`.
- Hardened user-facing error localization in feed surfaces by rendering localized fallback errors instead of raw API error strings; also made date formatting locale-aware via `document.documentElement.lang` in `src/lib/feed/client.ts`.
- Added tests for the locale switcher (`src/components/i18n/locale-switcher.test.tsx`) and updated affected component tests to mock the switcher cleanly.
- Validated successfully: `lint`, `test`, `typecheck`, `build`.
- Polished RTL alignment in dashboard surfaces by replacing directional utility classes with logical ones (`md:text-end`, `lg:pe-1`) in `src/components/layout/app-shell.tsx`.
- Localized map control ARIA labels for English/Hebrew via `mapPage.mapControlsLabels` and wired them through `src/app/[locale]/map/page.tsx`, `src/components/map/map-preview.tsx`, `src/components/map/crisis-map.tsx`, and `src/components/ui/map.tsx`.
- Updated map control positioning to direction-aware `bottom-end` support in `src/components/ui/map.tsx` and applied it in the crisis map.
- Expanded map preview tests to verify localized control labels are passed through (`src/components/map/map-preview.test.tsx`).
- Re-validated successfully: `lint`, `test`, `typecheck`, `build`.
- Added notification schemas (`src/lib/schemas/notifications.ts`) and a realtime notification center hook (`src/components/notifications/use-notification-center.ts`) that listens to `alerts` + `official_updates` and only enqueues newly-active items.
- Implemented a global in-app notification UI (`src/components/notifications/notification-center.tsx`) mounted in locale layout (`src/app/[locale]/layout.tsx`) so dashboard/feed/map all receive notifications.
- Enforced notification priority with official alerts above official guidance and deduplicated repeated row events.
- Added localized notification copy in `src/messages/en.json` and `src/messages/he.json` with parity preserved by `src/messages/messages.test.ts`.
- Added focused tests for notification priority/dedupe/transition behavior (`src/components/notifications/use-notification-center.test.tsx`).
- Re-validated successfully after notifications slice: `lint`, `test`, `typecheck`, `build`.
- Defined initial map overlay baseline scope using local fixture data with explicit visual priority separation from official alert markers.
- Added overlay schemas and validated fixture loading (`src/lib/schemas/map-overlays.ts`, `src/lib/map/overlay-fixtures.ts`, `src/lib/map/overlay-fixtures.test.ts`).
- Implemented first map overlay pass with layer toggles, legend updates, and map rendering for shelters/road closures/hospitals (`src/components/map/map-overlay-controls.tsx`, `src/components/map/map-preview.tsx`, `src/components/map/map-legend.tsx`, `src/components/map/crisis-map.tsx`, `src/app/[locale]/map/page.tsx`).
- Added overlay localization keys for English/Hebrew and preserved message key parity coverage (`src/messages/en.json`, `src/messages/he.json`, `src/messages/messages.test.ts`).
- Expanded map preview coverage for overlay toggle behavior (`src/components/map/map-preview.test.tsx`).
- Re-validated successfully after map overlay slice: `lint`, `test`, `typecheck`, `build`.
- Added `supabase/migrations/0009_add_map_overlay_tables.sql` with new overlay tables (`shelters`, `road_closures`, `hospitals`), indexes, and `sources.source_type` support for `map_overlay`.
- Added `supabase/migrations/0010_seed_map_overlay_sources_and_rows.sql` to seed overlay ownership sources and initial overlay records idempotently.
- Extended source typing to include `map_overlay` in `src/lib/schemas/source.ts` and added schema coverage in `src/lib/schemas/source.test.ts`.
- Added DB overlay data layer in `src/lib/db/map-overlays.ts` with Zod-validated mapping, safe row skipping, DB query fan-out, and fallback behavior.
- Updated map page wiring to use DB-backed overlays via `src/app/[locale]/map/page.tsx` (`getMapOverlays`) instead of fixture-only loading.
- Added overlay DB mapping/fallback tests in `src/lib/db/map-overlays.test.ts`.
- Expanded map rendering coverage in `src/components/map/map-preview.test.tsx` for DB-backed overlay payloads while ensuring official alert markers remain visible.
- Re-validated successfully after Phase 7 overlay integration slice: `lint`, `test`, `typecheck`, `build`.
- Applied Supabase migrations `0009` and `0010` to the remote project via `supabase db push`.
- Verified runtime DB state for overlays: 3 active `map_overlay` sources, 3 shelters, 2 road closures, and 3 hospitals.
- Ran a live runtime check against `http://127.0.0.1:3100/en/map` after `next start`; map page renders overlay sections/labels (Shelters, Road Closures, Hospitals) successfully.
- Added persisted notification preference store in `src/store/use-notification-preferences-store.ts` for browser Notification API opt-in state.
- Added browser notification permission hook + opt-in control UI in `src/components/notifications/use-browser-notification-permission.ts` and `src/components/notifications/browser-notification-opt-in.tsx`.
- Integrated the opt-in control into dashboard/feed/map headers in `src/components/layout/app-shell.tsx`, `src/components/feed/live-feed-page.tsx`, and `src/components/map/map-preview.tsx`.
- Updated `src/components/notifications/notification-center.tsx` to dispatch browser notifications only when opted in, permission is granted, and the tab is not visible.
- Added and localized browser notification strings in `src/messages/en.json` and `src/messages/he.json`.
- Expanded tests for browser notification permission, opt-in UI behavior, and background-only dispatch (`src/components/notifications/use-browser-notification-permission.test.tsx`, `src/components/notifications/browser-notification-opt-in.test.tsx`, `src/components/notifications/notification-center.test.tsx`) and updated related component test mocks.
- Re-validated successfully after browser notification follow-up: `lint`, `test`, `typecheck`, `build`.
- Fixed an SSR hydration mismatch in `src/components/notifications/browser-notification-opt-in.tsx` by making notification permission state deterministic on first render and deferring browser-only UI branching until hydration completes.
- Re-validated the notification slice with focused tests: `npm test -- browser-notification-opt-in use-browser-notification-permission`.
- Completed Israel-only Oref relay rollout for official alerts using Kamatera + Caddy TLS (`https://212.80.205.239.sslip.io`).
- Verified relay endpoints return healthy responses: `/healthz` -> `200`; `/oref-alerts?token=...` -> `200` with Oref JSON payload.
- Cut over `sources.feed_url` for `home-front-command-alerts` to the relay URL and kept source active.
- Verified `official_alerts` ingestion recovered from recurring `Official alerts request failed (403)` failures to successful runs after cutover.
- Confirmed latest successful runs may report `items_fetched = 0` when Oref has no active alerts (expected behavior).

In progress:

- None right now.

Next up:

1. Add first overlay ingestion path (manual seed refresh script or worker slice) so overlay data updates through ingestion flow rather than static seed-only records.
2. Rotate relay token and keep `/healthz` monitoring active; settle `ALERTS_INTERVAL_SECONDS` to a steady value (`15`-`20` seconds recommended) after burn-in.
3. Keep full validation (`lint`, `test`, `typecheck`, `build`) green on each follow-up slice.

Blockers:

- None right now.

Notes:

- Phase 1 foundation is complete, including Supabase connectivity and schema push.
- `proxy.ts` is used instead of deprecated `middleware.ts` for Next.js 16.

---

## Session history

### YYYY-MM-DD

Phase:
Focus:

Done:

-

In progress:

-

Next up:

1.
2.
3.

Blockers:

-

Notes:

-
