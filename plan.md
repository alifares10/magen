# Magen (מגן) — Crisis Monitor Project Plan

## 1. Project overview
Build a real-time crisis monitoring dashboard focused on Israel, designed to help users quickly understand official alerts, official guidance, live news, and visual context from maps and live streams.

The product should prioritize actionable safety information over noisy or speculative content.

## 2. Product goals
### Primary goals
- Show official alerts in near real time
- Show official guidance and status updates
- Provide a live news feed from trusted RSS sources
- Provide map-based situational awareness
- Allow users to watch selected locations
- Display a live YouTube stream as secondary visual context

### Product principles
- Official sources first
- Clear separation between official alerts, official guidance, and news
- Fast scanning and low cognitive load
- Real-time updates where possible
- Mobile-friendly, but desktop-first for the initial dashboard experience

## 3. MVP scope
### Included in MVP
- Official alerts feed
- Official guidance/status panel
- Live news feed from RSS sources
- Main map panel
- Watchlist / watched locations
- Live YouTube stream panel
- Top breaking-news ticker
- Right-rail tabbed live feed

### Not included in MVP
- X/Twitter live feed
- Unverified social media monitoring
- Advanced analytics or forecasting
- Casualty counters
- Full multilingual system beyond basic support if it slows delivery
- Complicated roles/permissions
- Heavy microservice architecture

## 4. Main layout
### Desktop layout
#### Top header
- App logo/name
- Region selector
- City search
- Last updated timestamp
- Source / connection health status

#### Top ticker
- Breaking official updates
- Breaking news headlines
- Short, horizontally scrolling items
- Severity/source tags

#### Main content area
##### Left sidebar
- Navigation
- Watched locations
- Filters
- Source toggles
- Quick settings

##### Center area
- Primary panel: live YouTube stream or map
- Under main panel:
  - Latest alert card
  - Official guidance card
  - Watched locations summary card

##### Right rail
Tabbed live feed:
- Alerts
- News
- Official

Each tab should update in near real time.

### Mobile direction
- Stacked layout
- Top ticker remains visible
- Main video/map at top
- Cards below
- Feed tabs below cards
- Sidebar functionality moved into drawer/sheet

Note: The right-rail tabbed feed is a core piece of the experience. On mobile, a decision is needed on whether it lives below the cards as a full-width section or as a bottom sheet/drawer. Worth a quick wireframe decision before build.

## 5. Core user experience
### Main page
- Top ticker
- Main visual panel (stream/map)
- Latest alert card
- Official guidance card
- Watched locations card
- Right-side tabbed live feed

### Map page
- Full map view
- Active/recent alert markers
- Watched city markers
- Clickable markers for alert details

### Feed page
- Feed-only view
- Tabs for Alerts / News / Official
- Sorting by newest first

## 6. Technical stack
### Frontend
- Next.js 16
- React Compiler (stable, enabled via `reactCompiler: true` in next.config — provides automatic memoization, removing the need for manual useMemo/useCallback)
- Turbopack (default bundler in Next.js 16)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand

### Map
- mapcn
- MapLibre under the hood

### Backend / data
- Supabase Postgres
- Supabase Realtime
- Supabase Auth later if needed
- Zod for validation

### Worker / ingestion
- Railway worker for scheduled ingestion jobs
- RSS parser for news sources
- Fetch-based integration for official sources

### Testing
- Vitest for unit and integration tests
- React Testing Library for UI/component tests
- ESLint for code quality checks
- Validation rule: run lint and relevant tests after each meaningful task; run full validation before ending a session or marking major work complete

### Deployment
- Vercel for frontend
- Supabase for database/realtime
- Railway for workers

### Internationalization and RTL
- next-intl for translations and locale management
- shadcn/ui RTL support enabled from the start (rtl: true in components.json, CLI auto-converts physical CSS classes to logical equivalents)
- DirectionProvider wrapping the app, switching dir attribute based on locale
- Noto Sans Hebrew (@fontsource-variable/noto-sans-hebrew) as the Hebrew font
- Default locale: English (LTR)
- Planned locale: Hebrew (RTL)
- Strategy: wire up next-intl and use t('key') from day one so all strings are translation-ready; actual Hebrew translations and locale switcher UI come later
- RTL considerations: shadcn handles component-level RTL automatically; layout-level RTL (sidebar position, ticker scroll direction, map controls) will need manual attention when Hebrew is added

## 7. Data model
### Tables
#### sources
Stores all configured data sources.

Fields:
- id
- name
- slug
- source_type
- base_url
- feed_url
- is_active
- priority
- created_at

#### alerts
Stores official alert events.

Fields:
- id
- source_id
- external_id
- title
- message
- alert_type
- severity
- status
- country
- region
- city
- location_name
- lat
- lng
- published_at
- ingested_at
- raw_payload

#### news_items
Stores live RSS news entries.

Fields:
- id
- source_id
- external_id
- title
- summary
- url
- author
- topic
- region
- country
- language
- severity
- published_at
- ingested_at
- image_url
- is_breaking
- raw_payload

#### official_updates
Stores official instructions, guidance, restrictions, and policy updates.

Fields:
- id
- source_id
- external_id
- title
- body
- update_type
- severity
- country
- region
- published_at
- ingested_at
- is_active
- raw_payload

#### live_streams
Stores live YouTube stream data.

Note: Since streams are seeded manually at first, source_id should be nullable or a manual/internal source record should be created to keep referential integrity clean.

Fields:
- id
- source_id (nullable)
- title
- description
- platform
- embed_url
- watch_url
- region
- country
- is_active
- sort_order
- last_checked_at
- thumbnail_url
- created_at

#### watched_locations
Stores user-selected watched cities/regions.

Note: Since auth is deferred, user_id handling in the interim needs a strategy — options include anonymous session IDs, local storage, or a hardcoded default user.

Fields:
- id
- user_id
- name
- country
- region
- city
- lat
- lng
- radius_km
- created_at

#### ingestion_runs
Stores ingestion run logs for debugging and monitoring.

Fields:
- id
- source_id
- job_type
- status
- started_at
- finished_at
- items_fetched
- items_inserted
- error_message

## 8. Realtime data flow
### Official alerts flow
1. Worker polls official alert source
2. Data is parsed and validated with Zod
3. Alert is normalized
4. Alert is deduplicated
5. Alert is inserted into alerts table
6. Supabase Realtime pushes update to UI
7. UI updates alert card, right rail, and map

### News flow
1. Worker polls RSS feeds
2. Feed items are parsed
3. Items are validated and normalized
4. Items are deduplicated by URL/hash
5. Items are inserted into news_items
6. UI updates top ticker and news feed

### Official guidance flow
1. Worker polls official guidance source
2. Update is parsed and validated
3. Update is normalized
4. Previous active update may be marked inactive
5. New update is inserted into official_updates
6. UI updates official guidance card and official feed tab

### Live streams flow
1. Stream records are seeded manually at first
2. UI fetches active streams
3. Selected stream is embedded in main panel
4. Optional periodic health check updates stream availability

### Watched locations flow
1. User adds watched location
2. Location is stored in watched_locations
3. UI filters alerts/news based on watched areas
4. Matching items are surfaced more prominently

## 9. Polling strategy
- Alerts: every 15 to 30 seconds if source allows
- Official updates: every 1 to 2 minutes
- News RSS: every 2 to 5 minutes
- Stream availability checks: every 5 to 10 minutes

## 10. Deduplication rules
### Alerts
Prefer external_id.
Fallback: hash of title + city + alert_type + rounded published time.

### News
Prefer URL uniqueness.
Fallback: hash of title + source + published time.

### Official updates
Prefer external_id.
Fallback: hash of title + published time.

## 11. Severity model
Use a normalized severity scale across the app:
- low
- medium
- high
- critical

## 12. API design
### Main API routes
- GET /api/dashboard/overview
- GET /api/alerts
- GET /api/news
- GET /api/official-updates
- GET /api/live-streams

### Overview endpoint should return
- latest active alert
- latest official update
- top news items
- active stream(s)
- watched-location matches

## 13. UI components
### Shared components
- Header
- TickerBar
- RightRailTabs
- FeedItemCard
- AlertCard
- OfficialUpdateCard
- WatchedLocationsCard
- StreamPlayerCard
- MapPanel
- SourceBadge
- SeverityBadge
- LastUpdatedLabel

### Map-related components
- CrisisMap
- AlertMarker
- WatchedLocationMarker
- MapLegend
- MapPopupCard

## 14. Implementation phases
### Phase 1 — foundation
- Create project repo
- Set up Next.js app
- Install Tailwind, shadcn/ui, Zustand, mapcn, Zod
- Set up Supabase project
- Create base database schema

### Phase 2 — ingestion and data
- Build sources table and seed sources
- Build RSS ingestion worker
- Build official alerts ingestion worker
- Build official guidance ingestion worker
- Add dedupe logic
- Add ingestion logging

### Phase 3 — MVP UI
- Build layout shell
- Build top ticker
- Build center panel
- Build right-rail tabs
- Build latest alert card
- Build official guidance card
- Build watched locations card
- Build stream player section

### Phase 4 — map and watchlist
- Add mapcn map panel
- Add alert markers
- Add watched location markers
- Add location filtering

### Phase 5 — realtime polish
- Add Supabase Realtime subscriptions
- Add live UI refresh behavior
- Add source health indicators
- Improve loading and error states

### Phase 6 — post-MVP improvements
- Notifications
- Shelter/road/hospital layers
- Better multilingual support
- Additional source controls
- Optional social signals tab

## 15. Development priorities
### Highest priority
- Alerts ingestion and display
- Official guidance ingestion and display
- Clean layout shell
- Reliable news feed ingestion
- Stable database schema

### Medium priority
- Map markers
- Watchlist matching
- Stream availability checks
- Better feed tagging

### Lower priority
- Personalization and auth
- Additional map overlays
- Advanced analytics

## 16. Risks and considerations
### Product risks
- Source reliability may change
- Alert source formats may change
- News feeds may be noisy or duplicated
- Live streams may go offline unexpectedly

### Technical risks
- Over-polling external sources
- Poor deduplication causing duplicate UI items
- Realtime subscriptions causing noisy rerenders
- Map clutter if too many markers are shown at once

### Product rules
- Never mix official alerts and news visually without labels
- Keep official data clearly marked
- Treat stream/video as secondary context, not source of truth
- Keep newest alert visible outside of tabs

## 17. Suggested folder structure
```text
app/
  dashboard/
  map/
  feed/
components/
  layout/
  feed/
  alerts/
  official/
  map/
  streams/
lib/
  api/
  db/
  schemas/
  utils/
store/
workers/
  rss/
  alerts/
  official/
supabase/
  migrations/
```

## 18. Immediate next steps
1. Create Supabase schema
2. Seed sources table
3. Build RSS ingestion worker
4. Build alerts ingestion worker
5. Build overview page layout
6. Add right-rail live feed tabs
7. Add map panel with mapcn
8. Add stream player panel

## 19. Definition of MVP done
The MVP is considered done when:
- Official alerts are being ingested and shown live
- Official guidance is visible and updating
- Live news feed is being populated from RSS
- Main dashboard layout is functional
- Map panel displays alerts/watched locations
- One or more live YouTube streams can be shown
- Right-side feed tabs work cleanly
- Core experience is usable on desktop and acceptable on mobile


